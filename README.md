# 概念理解アプリブログ — アーキテクチャ設計書

## 1. プロジェクト概要

概念図（図解・ダイアグラム）を画像としてアップロードし、それに対する自分の理解をアウトプットする個人ブログ。
見出し画像自体が概念説明図となり、ホワイトボード的なビジュアルが特徴。

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|---------|------|------|
| フロントエンド | Next.js (App Router) | Vercel にデプロイ |
| API | Hono | Cloudflare Workers 上で動作 |
| DB | Cloudflare D1 (SQLite) | 投稿メタデータ・ユーザー情報 |
| 画像ストレージ | Cloudflare R2 | S3互換、jpeg/png/pdf を保存 |
| 認証 | Google OAuth 2.0 | Hono側で独自実装 |
| スタイリング | Tailwind CSS v4 | 白基調+紫アクセント、ダークモード |
| ORM | Drizzle ORM | D1対応、型安全 |

## 3. システムアーキテクチャ

```
┌─────────────────────────────────┐
│        Vercel                   │
│  ┌───────────────────────────┐  │
│  │  Next.js (App Router)     │  │
│  │                           │  │
│  │  /          → 投稿一覧    │  │
│  │  /posts/[slug] → 記事詳細 │  │
│  │  /admin     → 管理画面    │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ fetch (REST)
               ▼
┌─────────────────────────────────┐
│     Cloudflare Workers          │
│  ┌───────────────────────────┐  │
│  │  Hono API                 │  │
│  │                           │  │
│  │  GET  /api/posts          │  │
│  │  GET  /api/posts/:slug    │  │
│  │  POST /api/posts          │  │
│  │  PUT  /api/posts/:id      │  │
│  │  DELETE /api/posts/:id    │  │
│  │  PUT  /api/posts/:id/pin  │  │
│  │  PUT  /api/posts/:id/sort │  │
│  │  GET  /api/categories     │  │
│  │  POST /api/categories     │  │
│  │  PUT  /api/categories/:id │  │
│  │  DELETE /api/categories/:id│  │
│  │  GET  /api/tags           │  │
│  │  POST /api/tags           │  │
│  │  DELETE /api/tags/:id     │  │
│  │  PUT  /api/posts/:id/tags │  │
│  │  GET  /api/posts/:id/relations    │
│  │  PUT  /api/posts/:id/relations    │
│  │  POST /api/upload         │  │
│  │  GET  /api/auth/google    │  │
│  │  GET  /api/auth/callback  │  │
│  │  POST /api/auth/logout    │  │
│  │  GET  /api/auth/me        │  │
│  └──┬──────────┬─────────────┘  │
│     │          │                │
│     ▼          ▼                │
│  ┌──────┐  ┌──────┐            │
│  │  D1  │  │  R2  │            │
│  └──────┘  └──────┘            │
└─────────────────────────────────┘
```

## 4. データモデル (D1)

### ER図

```
categories 1───* posts *───* tags
                  │
                  │ (self-referencing M:N)
                  │
              post_relations
```

### 4.1 posts テーブル

```sql
CREATE TABLE posts (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  body          TEXT NOT NULL,                -- Markdown
  image_key     TEXT,                          -- R2 のオブジェクトキー
  category_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  is_pinned     INTEGER NOT NULL DEFAULT 0,    -- 1 = ピン留め
  sort_order    INTEGER NOT NULL DEFAULT 0,    -- 手動ソート用（大きいほど上）
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_sort ON posts(is_pinned DESC, sort_order DESC, created_at DESC);
```

> **一覧の表示順**: `ORDER BY is_pinned DESC, sort_order DESC, created_at DESC`
> ピン留め記事が最上部 → 手動ソート順 → 新しい順

### 4.2 categories テーブル

```sql
CREATE TABLE categories (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  color      TEXT,                          -- HEX カラーコード（例: #8B5CF6）
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

> **設計判断**: カテゴリは1投稿1つ（N:1）。タグとの使い分けは：
> - カテゴリ = 大分類（例: 「設計パターン」「データ構造」「ネットワーク」）
> - タグ = 横断的な属性（例: 「UML」「初心者向け」「Go言語」）

### 4.3 tags テーブル

```sql
CREATE TABLE tags (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  is_preset  INTEGER NOT NULL DEFAULT 0,    -- 1 = 事前定義, 0 = フリー入力で生成
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tags_preset ON tags(is_preset);
```

### 4.4 post_tags テーブル（中間テーブル）

```sql
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);
```

### 4.5 post_relations テーブル（関連記事）

```sql
CREATE TABLE post_relations (
  source_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (source_id, target_id)
);

CREATE INDEX idx_post_relations_target ON post_relations(target_id);
```

> **設計判断**: 関連記事は双方向表示する。
> A→B のリレーションがあれば、B の記事ページにも A を関連として表示。
> クエリ: `WHERE source_id = ? OR target_id = ?` で両方向を取得。

### 4.6 sessions テーブル

```sql
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,              -- セッションID (crypto.randomUUID)
  user_email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

> **設計判断**: 管理者1人のため users テーブルは不要。
> 環境変数 `ADMIN_EMAIL` と session の `user_email` を突合して認可する。

### 4.7 主要クエリパターン

```sql
-- 投稿一覧（ピン留め優先 + 手動ソート + 新着順）
SELECT p.*, c.name AS category_name, c.color AS category_color
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'published'
ORDER BY p.is_pinned DESC, p.sort_order DESC, p.created_at DESC;

-- タグで絞り込み
SELECT p.*, c.name AS category_name
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
INNER JOIN post_tags pt ON p.id = pt.post_id
INNER JOIN tags t ON pt.tag_id = t.id
WHERE p.status = 'published' AND t.slug = ?
ORDER BY p.is_pinned DESC, p.sort_order DESC, p.created_at DESC;

-- 記事に紐づくタグ一覧
SELECT t.*
FROM tags t
INNER JOIN post_tags pt ON t.id = pt.tag_id
WHERE pt.post_id = ?;

-- 関連記事（双方向）
SELECT p.*
FROM posts p
WHERE p.id IN (
  SELECT target_id FROM post_relations WHERE source_id = ?
  UNION
  SELECT source_id FROM post_relations WHERE target_id = ?
) AND p.status = 'published';

-- タグ候補（事前定義 + 既存フリータグをサジェスト）
SELECT * FROM tags
WHERE is_preset = 1
   OR name LIKE ? || '%'
ORDER BY is_preset DESC, name ASC;
```

## 5. 認証フロー (Google OAuth 2.0)

```
[ブラウザ]                    [Hono API]                [Google]
    │                            │                         │
    │  GET /api/auth/google      │                         │
    │ ─────────────────────────► │                         │
    │                            │  state + PKCE 生成      │
    │  302 → Google OAuth URL    │                         │
    │ ◄───────────────────────── │                         │
    │                            │                         │
    │  ─── Google ログイン画面 ──────────────────────────► │
    │  ◄── code + state ────────────────────────────────── │
    │                            │                         │
    │  GET /api/auth/callback    │                         │
    │    ?code=xxx&state=yyy     │                         │
    │ ─────────────────────────► │                         │
    │                            │  POST /oauth2/v4/token  │
    │                            │ ──────────────────────► │
    │                            │  ◄── access_token ───── │
    │                            │                         │
    │                            │  GET /userinfo          │
    │                            │ ──────────────────────► │
    │                            │  ◄── email, name ────── │
    │                            │                         │
    │                            │  email === ADMIN_EMAIL? │
    │                            │  → session 作成 (D1)    │
    │                            │  → Set-Cookie           │
    │  302 → /admin              │                         │
    │ ◄───────────────────────── │                         │
```

**セキュリティ要件:**
- PKCE (Proof Key for Code Exchange) を使用
- state パラメータで CSRF 防止
- セッションは HttpOnly + Secure + SameSite=Lax Cookie
- セッション有効期限: 7日（スライディング更新なし）

## 6. 画像アップロードフロー

```
[管理画面]              [Hono API]              [R2]
    │                       │                     │
    │  POST /api/upload     │                     │
    │  (multipart/form)     │                     │
    │ ────────────────────► │                     │
    │                       │  バリデーション      │
    │                       │  - ファイル種別       │
    │                       │  - サイズ上限 5MB    │
    │                       │  - 認証チェック      │
    │                       │                     │
    │                       │  PUT object          │
    │                       │  key: images/{uuid}  │
    │                       │ ──────────────────► │
    │                       │  ◄── 200 ────────── │
    │                       │                     │
    │  { key, url }         │                     │
    │ ◄──────────────────── │                     │
```

**R2 キー命名規則:** `images/{year}/{month}/{uuid}.{ext}`

**公開配信:** R2 のパブリックバケット or Cloudflare Workers 経由で配信
→ `GET /api/images/:key` でプロキシするか、R2 Custom Domain を使う

## 7. フロントエンド構成 (Next.js)

```
src/
├── app/
│   ├── layout.tsx              # ルートレイアウト（テーマプロバイダ）
│   ├── page.tsx                # 投稿一覧（SSG or ISR）
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx        # 記事詳細（SSG or ISR）
│   └── admin/
│       ├── layout.tsx          # 認証ガード
│       ├── page.tsx            # ダッシュボード
│       ├── new/
│       │   └── page.tsx        # 新規投稿
│       └── edit/
│           └── [id]/
│               └── page.tsx    # 編集
├── components/
│   ├── ui/                     # 汎用UIコンポーネント
│   ├── post-card.tsx           # 一覧カード（ホワイトボード風）
│   ├── post-viewer.tsx         # 記事表示
│   ├── markdown-editor.tsx     # Markdownエディタ
│   └── image-uploader.tsx      # 画像アップロード
├── lib/
│   ├── api.ts                  # Hono API クライアント
│   └── theme.ts                # ダークモード制御
└── types/
    └── index.ts                # 共有型定義
```

## 8. API設計 (Hono)

```
src/
├── index.ts                    # エントリポイント
├── routes/
│   ├── posts.ts                # 投稿 CRUD + ピン留め・ソート
│   ├── categories.ts           # カテゴリ CRUD
│   ├── tags.ts                 # タグ CRUD + 投稿へのタグ付け
│   ├── relations.ts            # 関連記事の紐づけ
│   ├── upload.ts               # 画像アップロード
│   └── auth.ts                 # Google OAuth
├── middleware/
│   ├── auth.ts                 # セッション検証ミドルウェア
│   └── cors.ts                 # CORS 設定
├── db/
│   ├── schema.ts               # Drizzle スキーマ
│   └── index.ts                # D1 接続
└── types/
    └── env.ts                  # Bindings 型定義
```

### Bindings 型定義

```typescript
type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_EMAIL: string;
  SESSION_SECRET: string;
  FRONTEND_URL: string;
};
```

## 9. 画像仕様

### 推奨アップロードサイズ

| 用途 | 推奨サイズ | アスペクト比 | 最大ファイルサイズ |
|------|-----------|-------------|------------------|
| サムネイル（カード表示） | 1200 × 900 px | 4:3 | 5MB |
| 本文内画像 | 幅 1600px 以下推奨 | 自由 | 5MB |

### サムネイル表示ルール

- **一覧カード**: 4:3 の `object-fit: cover` で統一表示。アップロード画像が比率に合わない場合は中央クロップ
- **OGP画像**: サムネイルから自動生成（1200×630 にリサイズ・余白追加）

### 記事詳細ページでの表示

- **デフォルト**: 原寸表示（本文幅 `max-width: 768px` 内に収まるよう `max-width: 100%` を適用）
- **拡大**: クリックでライトボックス表示（原寸 or ブラウザ幅いっぱい）
- **PDF**: インラインプレビュー + ダウンロードリンク

### R2 保存時の処理

```
アップロード
    │
    ├── 原本保存: images/{year}/{month}/{uuid}.{ext}
    │
    └── サムネイル生成（Workers で on-the-fly or アップロード時）
        └── thumbnails/{year}/{month}/{uuid}_thumb.webp
            → 1200×900, WebP, quality 80
```

> **設計判断**: サムネイルはアップロード時に生成して R2 に保存する方式を推奨。
> on-the-fly リサイズは Cloudflare Image Resizing（有料）が必要なため、
> 個人ブログでは sharp 等で Workers 内処理するか、アップロード時生成がコスト効率が良い。
> ただし Workers の CPU 制限（10ms free / 50ms paid）に注意。
> 画像処理が重い場合は Cloudflare Queue 経由の非同期処理を検討。

### 対応フォーマット

| フォーマット | アップロード | 表示 | 備考 |
|------------|------------|------|------|
| JPEG | ✅ | ✅ | 写真・スクリーンショット向き |
| PNG | ✅ | ✅ | 図解・透過画像向き |
| PDF | ✅ | ✅ (プレビュー) | 複数ページの資料用 |
| WebP | — | ✅ | サムネイル保存形式 |

## 10. デザインシステム

### カラーパレット

```
Light Mode:
  背景:       #FAFAFA (gray-50相当)
  カード背景:  #FFFFFF
  テキスト:    #1F2937 (gray-800)
  紫プライマリ: #8B5CF6 (violet-500)
  紫ライト:    #C4B5FD (violet-300)
  紫ダーク:    #6D28D9 (violet-700)
  ボーダー:    #E5E7EB (gray-200)
  ドット:      #D1D5DB (gray-300)

Dark Mode:
  背景:       #0D1117 (GitHub Dark風)
  カード背景:  #161B22
  テキスト:    #E6EDF3
  紫プライマリ: #A78BFA (violet-400)
  ボーダー:    #30363D
  ドット:      #21262D
```

### ホワイトボード風カードデザイン

```
┌─────────────────────────────────────┐
│ · · · · · · · · · · · · · · · · · · │  ← ドットグリッド背景
│ ·                                 · │
│ ·    ┌──────┐     ┌──────┐       · │  ← アップロード画像が
│ ·    │ 概念A │────►│ 概念B │       · │     ここに表示される
│ ·    └──────┘     └──────┘       · │
│ ·                                 · │
│ · · · · · · · · · · · · · · · · · · │
├─────────────────────────────────────┤
│ タイトル: OOPの継承を図解する       │
│ 2024-01-15 · #設計パターン          │
└─────────────────────────────────────┘
```

## 11. 環境変数一覧

### Cloudflare Workers (wrangler.toml)

```toml
[vars]
FRONTEND_URL = "https://your-app.vercel.app"
ADMIN_EMAIL = "your-email@gmail.com"

# Secrets (wrangler secret put)
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
# SESSION_SECRET
```

### Vercel

```
NEXT_PUBLIC_API_URL=https://api.your-domain.workers.dev
```

## 12. デプロイ構成

```
GitHub Repository (モノレポ)
├── apps/
│   ├── web/          → Vercel (自動デプロイ)
│   └── api/          → Cloudflare Workers (wrangler deploy)
├── packages/
│   └── shared/       → 共有型定義
├── turbo.json
└── package.json
```

**CI/CD:** GitHub Actions で api/ 変更時に `wrangler deploy` を自動実行

## 13. 今後の拡張可能性

- **全文検索**: D1 の FTS5 を活用した投稿検索
- **OGP生成**: 投稿画像から自動OGP画像生成 (Cloudflare Workers + @vercel/og)
- **AI要約**: アップロード画像をLLMで解析し、概念の説明を自動生成
- **シリーズ機能**: 関連記事を順序付きでグルーピングし、連載形式で表示


## 14. UI/UX 具体

```tsx
import { useState } from "react";

const pages = ["home", "detail", "admin", "editor"];

const DotGrid = ({ dark }) => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `radial-gradient(circle, ${dark ? "#30363d" : "#c4b5fd"} 1px, transparent 1px)`,
      backgroundSize: "20px 20px",
      opacity: dark ? 0.5 : 0.35,
    }}
  />
);

const Tag = ({ label, dark }) => (
  <span
    style={{
      display: "inline-block",
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 12,
      background: dark ? "#2d1b69" : "#ede9fe",
      color: dark ? "#c4b5fd" : "#6d28d9",
      fontWeight: 500,
      letterSpacing: "0.01em",
    }}
  >
    {label}
  </span>
);

const CategoryBadge = ({ label, color, dark }) => (
  <span
    style={{
      display: "inline-block",
      fontSize: 11,
      padding: "2px 10px",
      borderRadius: 4,
      background: dark ? `${color}22` : `${color}18`,
      color: dark ? "#e6edf3" : color,
      border: `1px solid ${dark ? `${color}44` : `${color}33`}`,
      fontWeight: 600,
      letterSpacing: "0.02em",
    }}
  >
    {label}
  </span>
);

const PostCard = ({ title, date, category, tags, pinned, dark, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: dark ? "#161b22" : "#fff",
      border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
      borderRadius: 12,
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.2s ease",
      position: "relative",
      boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = dark
        ? "0 4px 16px rgba(139,92,246,0.12)"
        : "0 4px 16px rgba(139,92,246,0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = dark ? "none" : "0 1px 3px rgba(0,0,0,0.04)";
    }}
  >
    {pinned && (
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          background: dark ? "#6d28d9" : "#8b5cf6",
          color: "#fff",
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 4,
          fontWeight: 600,
        }}
      >
        📌 PIN
      </div>
    )}
    <div
      style={{
        position: "relative",
        aspectRatio: "4/3",
        background: dark ? "#0d1117" : "#f8f7ff",
        overflow: "hidden",
      }}
    >
      <DotGrid dark={dark} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 56,
            height: 42,
            borderRadius: 8,
            background: "linear-gradient(135deg, #67e8f9, #a78bfa)",
            opacity: 0.85,
            transform: "rotate(-6deg)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 2,
            background: dark ? "#6d28d9" : "#8b5cf6",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 56,
            height: 42,
            borderRadius: 8,
            background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
            opacity: 0.85,
            transform: "rotate(3deg)",
          }}
        />
      </div>
    </div>

    <div style={{ padding: "14px 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {category && <CategoryBadge label={category.name} color={category.color} dark={dark} />}
      </div>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: dark ? "#e6edf3" : "#1f2937",
          margin: 0,
          marginBottom: 8,
          lineHeight: 1.4,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {tags.map((t) => (
          <Tag key={t} label={t} dark={dark} />
        ))}
      </div>
      <p
        style={{
          fontSize: 12,
          color: dark ? "#7d8590" : "#9ca3af",
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {date}
      </p>
    </div>
  </div>
);

const HomePage = ({ dark, onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = [
    { id: "all", name: "All", color: "#8b5cf6" },
    { id: "pattern", name: "設計パターン", color: "#8b5cf6" },
    { id: "data", name: "データ構造", color: "#2563eb" },
    { id: "network", name: "ネットワーク", color: "#059669" },
  ];
  const posts = [
    { title: "OOPの継承を図解する", date: "2026-02-20", category: { name: "設計パターン", color: "#8b5cf6" }, tags: ["UML", "Java"], pinned: true },
    { title: "TCP/IPの4層モデルを理解する", date: "2026-02-18", category: { name: "ネットワーク", color: "#059669" }, tags: ["プロトコル", "基本情報"], pinned: false },
    { title: "二分探索木の操作と計算量", date: "2026-02-15", category: { name: "データ構造", color: "#2563eb" }, tags: ["アルゴリズム", "木構造"], pinned: false },
    { title: "MVCとMVVMの違いを図で比較", date: "2026-02-12", category: { name: "設計パターン", color: "#8b5cf6" }, tags: ["アーキテクチャ", "初心者向け"], pinned: false },
    { title: "HTTPリクエストのライフサイクル", date: "2026-02-10", category: { name: "ネットワーク", color: "#059669" }, tags: ["HTTP", "Web"], pinned: false },
    { title: "ハッシュテーブルの衝突解決法", date: "2026-02-08", category: { name: "データ構造", color: "#2563eb" }, tags: ["ハッシュ", "基本情報"], pinned: false },
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 36, paddingTop: 8 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: dark ? "#e6edf3" : "#1f2937",
            margin: 0,
            fontFamily: "'Noto Sans JP', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          概念
          <span style={{ color: "#8b5cf6" }}>理解</span>
          ノート
        </h1>
        <p
          style={{
            fontSize: 13,
            color: dark ? "#7d8590" : "#6b7280",
            marginTop: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Visualize concepts, deepen understanding
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: `1px solid ${activeCategory === c.id ? c.color : dark ? "#30363d" : "#e5e7eb"}`,
              background:
                activeCategory === c.id
                  ? dark
                    ? `${c.color}22`
                    : `${c.color}12`
                  : "transparent",
              color:
                activeCategory === c.id
                  ? dark
                    ? "#e6edf3"
                    : c.color
                  : dark
                  ? "#7d8590"
                  : "#6b7280",
              fontSize: 13,
              fontWeight: activeCategory === c.id ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {posts.map((p, i) => (
          <PostCard key={i} {...p} dark={dark} onClick={() => onNavigate("detail")} />
        ))}
      </div>
    </div>
  );
};

const DetailPage = ({ dark, onNavigate }) => (
  <div>
    <button
      onClick={() => onNavigate("home")}
      style={{
        background: "none",
        border: "none",
        color: dark ? "#7d8590" : "#6b7280",
        fontSize: 13,
        cursor: "pointer",
        padding: 0,
        marginBottom: 16,
        fontFamily: "'JetBrains Mono', monospace",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      ← 一覧に戻る
    </button>

    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <CategoryBadge label="設計パターン" color="#8b5cf6" dark={dark} />
      <span style={{ fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", fontFamily: "'JetBrains Mono', monospace" }}>
        2026-02-20
      </span>
    </div>

    <h1
      style={{
        fontSize: 26,
        fontWeight: 800,
        color: dark ? "#e6edf3" : "#1f2937",
        margin: "0 0 12px",
        fontFamily: "'Noto Sans JP', sans-serif",
        letterSpacing: "-0.01em",
      }}
    >
      OOPの継承を図解する
    </h1>

    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      <Tag label="UML" dark={dark} />
      <Tag label="Java" dark={dark} />
    </div>

    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
        marginBottom: 28,
        cursor: "zoom-in",
        background: dark ? "#0d1117" : "#f8f7ff",
      }}
    >
      <DotGrid dark={dark} />
      <div
        style={{
          position: "relative",
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 120,
            height: 56,
            borderRadius: 10,
            background: "linear-gradient(135deg, #67e8f9, #a78bfa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Animal
        </div>
        <div style={{ width: 2, height: 20, background: dark ? "#6d28d9" : "#8b5cf6" }} />
        <div style={{ display: "flex", gap: 24 }}>
          <div
            style={{
              width: 100,
              height: 48,
              borderRadius: 10,
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Dog
          </div>
          <div
            style={{
              width: 100,
              height: 48,
              borderRadius: 10,
              background: "linear-gradient(135deg, #c084fc, #9333ea)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Cat
          </div>
        </div>
        <p style={{ fontSize: 10, color: dark ? "#7d8590" : "#9ca3af", marginTop: 4 }}>
          💡 クリックで原寸表示
        </p>
      </div>
    </div>

    <div
      style={{
        color: dark ? "#c9d1d9" : "#374151",
        fontSize: 14.5,
        lineHeight: 1.85,
        fontFamily: "'Noto Sans JP', sans-serif",
        maxWidth: 768,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, color: dark ? "#e6edf3" : "#1f2937", marginBottom: 8 }}>
        継承とは
      </h2>
      <p style={{ marginBottom: 16 }}>
        オブジェクト指向プログラミングにおける継承は、既存のクラス（親クラス）の性質を新しいクラス（子クラス）が引き継ぐ仕組みです。
        コードの再利用性を高め、「is-a」関係を表現します。
      </p>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: dark ? "#e6edf3" : "#1f2937", marginBottom: 8 }}>
        図解のポイント
      </h2>
      <p style={{ marginBottom: 16 }}>
        上の図では、Animal クラスを Dog と Cat が継承しています。UML のクラス図では三角矢印（△）で継承関係を表現しますが、
        ここでは概念的な理解を優先し、上下の包含関係として図示しています。
      </p>
    </div>

    <div
      style={{
        marginTop: 32,
        padding: 20,
        borderRadius: 12,
        background: dark ? "#161b22" : "#faf5ff",
        border: `1px solid ${dark ? "#30363d" : "#ede9fe"}`,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: dark ? "#c4b5fd" : "#6d28d9",
          margin: "0 0 12px",
        }}
      >
        関連記事
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {["MVCとMVVMの違いを図で比較", "SOLIDの原則を1枚で理解する"].map((t) => (
          <div
            key={t}
            style={{
              fontSize: 13,
              color: dark ? "#a78bfa" : "#7c3aed",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, color: dark ? "#7d8590" : "#9ca3af" }}>→</span>
            {t}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AdminPage = ({ dark, onNavigate }) => {
  const drafts = [
    { title: "Observerパターンの構造", status: "draft", date: "2026-02-21" },
    { title: "REST vs GraphQL の選び方", status: "draft", date: "2026-02-19" },
  ];
  const published = [
    { title: "OOPの継承を図解する", status: "published", date: "2026-02-20", pinned: true },
    { title: "TCP/IPの4層モデルを理解する", status: "published", date: "2026-02-18", pinned: false },
    { title: "二分探索木の操作と計算量", status: "published", date: "2026-02-15", pinned: false },
  ];

  const StatusDot = ({ status }) => (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: status === "published" ? "#22c55e" : "#f59e0b",
        display: "inline-block",
      }}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: dark ? "#e6edf3" : "#1f2937",
            margin: 0,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          管理ダッシュボード
        </h2>
        <button
          onClick={() => onNavigate("editor")}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "#8b5cf6",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ＋ 新規投稿
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          { label: "公開中", value: "5", color: "#22c55e" },
          { label: "下書き", value: "2", color: "#f59e0b" },
          { label: "総画像数", value: "12", color: "#8b5cf6" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "16px 18px",
              borderRadius: 10,
              background: dark ? "#161b22" : "#fff",
              border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
            }}
          >
            <p style={{ fontSize: 11, color: dark ? "#7d8590" : "#9ca3af", margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: "4px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {[
        { title: "下書き", items: drafts },
        { title: "公開中", items: published },
      ].map((section) => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: dark ? "#7d8590" : "#6b7280",
              margin: "0 0 10px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {section.title}
          </h3>
          <div
            style={{
              borderRadius: 10,
              border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
              overflow: "hidden",
            }}
          >
            {section.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: dark ? "#161b22" : "#fff",
                  borderTop: i > 0 ? `1px solid ${dark ? "#30363d" : "#f3f4f6"}` : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusDot status={item.status} />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: dark ? "#e6edf3" : "#1f2937",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    {item.title}
                  </span>
                  {item.pinned && (
                    <span style={{ fontSize: 10, color: "#8b5cf6" }}>📌</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: dark ? "#7d8590" : "#9ca3af",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.date}
                  </span>
                  <span style={{ fontSize: 16, color: dark ? "#7d8590" : "#9ca3af", cursor: "pointer" }}>⋯</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const EditorPage = ({ dark, onNavigate }) => {
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState(["UML"]);
  const presetTags = ["UML", "アルゴリズム", "基本情報", "初心者向け", "Web", "Java", "Python"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button
          onClick={() => onNavigate("admin")}
          style={{
            background: "none",
            border: "none",
            color: dark ? "#7d8590" : "#6b7280",
            fontSize: 13,
            cursor: "pointer",
            padding: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          ← ダッシュボードに戻る
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
              background: "transparent",
              color: dark ? "#7d8590" : "#6b7280",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            下書き保存
          </button>
          <button
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: "#8b5cf6",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            公開する
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="タイトルを入力..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          fontSize: 24,
          fontWeight: 700,
          border: "none",
          outline: "none",
          background: "transparent",
          color: dark ? "#e6edf3" : "#1f2937",
          marginBottom: 20,
          fontFamily: "'Noto Sans JP', sans-serif",
          letterSpacing: "-0.01em",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            カテゴリ
          </label>
          <select
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
              background: dark ? "#161b22" : "#fff",
              color: dark ? "#e6edf3" : "#1f2937",
              fontSize: 13,
            }}
          >
            <option>選択してください</option>
            <option>設計パターン</option>
            <option>データ構造</option>
            <option>ネットワーク</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            スラッグ
          </label>
          <input
            type="text"
            placeholder="oop-inheritance"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
              background: dark ? "#161b22" : "#fff",
              color: dark ? "#e6edf3" : "#1f2937",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          タグ
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {presetTags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button
                key={t}
                onClick={() =>
                  setSelectedTags((prev) =>
                    active ? prev.filter((x) => x !== t) : [...prev, t]
                  )
                }
                style={{
                  padding: "4px 12px",
                  borderRadius: 14,
                  border: `1px solid ${active ? "#8b5cf6" : dark ? "#30363d" : "#e5e7eb"}`,
                  background: active ? (dark ? "#2d1b69" : "#ede9fe") : "transparent",
                  color: active ? (dark ? "#c4b5fd" : "#6d28d9") : dark ? "#7d8590" : "#6b7280",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {active ? "✓ " : ""}
                {t}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="+ 新しいタグを入力して Enter..."
          style={{
            width: "100%",
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px dashed ${dark ? "#30363d" : "#d1d5db"}`,
            background: "transparent",
            color: dark ? "#e6edf3" : "#1f2937",
            fontSize: 12,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          概念図アップロード
        </label>
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            border: `2px dashed ${dark ? "#30363d" : "#c4b5fd"}`,
            padding: 32,
            textAlign: "center",
            background: dark ? "#0d1117" : "#faf5ff",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <DotGrid dark={dark} />
          <div style={{ position: "relative" }}>
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>🖼️</p>
            <p style={{ fontSize: 13, color: dark ? "#7d8590" : "#6b7280", margin: 0 }}>
              ドラッグ＆ドロップ or クリックでアップロード
            </p>
            <p style={{ fontSize: 11, color: dark ? "#484f58" : "#9ca3af", marginTop: 4 }}>
              JPEG, PNG, PDF — 推奨 1200×900px (4:3) — 最大 5MB
            </p>
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          本文 (Markdown)
        </label>
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "6px 10px",
              borderBottom: `1px solid ${dark ? "#30363d" : "#f3f4f6"}`,
              background: dark ? "#161b22" : "#f9fafb",
            }}
          >
            {["B", "I", "H1", "H2", "📎", "🔗", "📋"].map((btn) => (
              <button
                key={btn}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "none",
                  background: "transparent",
                  color: dark ? "#7d8590" : "#6b7280",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: btn === "B" ? 700 : 400,
                  fontStyle: btn === "I" ? "italic" : "normal",
                }}
              >
                {btn}
              </button>
            ))}
          </div>
          <textarea
            placeholder="概念に対する理解をここに書く..."
            rows={8}
            style={{
              width: "100%",
              padding: 14,
              border: "none",
              outline: "none",
              resize: "vertical",
              background: dark ? "#0d1117" : "#fff",
              color: dark ? "#c9d1d9" : "#374151",
              fontSize: 14,
              lineHeight: 1.7,
              fontFamily: "'Noto Sans JP', sans-serif",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: "block", fontSize: 12, color: dark ? "#7d8590" : "#9ca3af", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
          関連記事
        </label>
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
            background: dark ? "#161b22" : "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: dark ? "#c4b5fd" : "#7c3aed" }}>🔗 MVCとMVVMの違いを図で比較</span>
            <button style={{ background: "none", border: "none", color: dark ? "#7d8590" : "#9ca3af", fontSize: 14, cursor: "pointer" }}>✕</button>
          </div>
          <input
            type="text"
            placeholder="記事タイトルで検索..."
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px dashed ${dark ? "#30363d" : "#d1d5db"}`,
              background: "transparent",
              color: dark ? "#e6edf3" : "#1f2937",
              fontSize: 12,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("home");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#0d1117" : "#fafafa",
        transition: "background 0.3s ease",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
          background: dark ? "#161b22" : "#fff",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            onClick={() => setPage("home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #67e8f9, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 14 }}>◇</span>
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: dark ? "#e6edf3" : "#1f2937",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              概念理解ノート
            </span>
          </div>

          <nav style={{ display: "flex", gap: 4 }}>
            {[
              { id: "home", label: "ホーム" },
              { id: "admin", label: "管理" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: page === n.id || (n.id === "admin" && (page === "admin" || page === "editor"))
                    ? dark ? "#30363d" : "#f3f4f6"
                    : "transparent",
                  color: dark ? "#e6edf3" : "#374151",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setDark(!dark)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #a78bfa, #6d28d9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Y
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {page === "home" && <HomePage dark={dark} onNavigate={setPage} />}
        {page === "detail" && <DetailPage dark={dark} onNavigate={setPage} />}
        {page === "admin" && <AdminPage dark={dark} onNavigate={setPage} />}
        {page === "editor" && <EditorPage dark={dark} onNavigate={setPage} />}
      </main>

      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          padding: "4px 6px",
          borderRadius: 10,
          background: dark ? "#161b22ee" : "#ffffffee",
          border: `1px solid ${dark ? "#30363d" : "#e5e7eb"}`,
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          zIndex: 100,
        }}
      >
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              border: "none",
              background: page === p ? (dark ? "#8b5cf620" : "#ede9fe") : "transparent",
              color: page === p ? "#8b5cf6" : dark ? "#7d8590" : "#9ca3af",
              fontSize: 11,
              fontWeight: page === p ? 600 : 400,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "capitalize",
            }}
          >
            {p === "home" ? "一覧" : p === "detail" ? "記事" : p === "admin" ? "管理" : "投稿"}
          </button>
        ))}
      </div>
    </div>
  );
}
```