# Canva App セットアップ手順

概念ノートブログ向け Canva App（エクスポート連携）の構築・設定手順。

---

## 前提

| 必要なもの | バージョン |
|---|---|
| Node.js | v18.20.4 または v20.17.0 |
| npm | v9 または v10 |
| Canva アカウント | 無料プランで可（後述） |

> **プランについて**
> Canva Developer Portal でのアプリ作成は無料アカウントで行える。
> 「チーム限定（Private）」配布には Enterprise プランが必要だが、
> **本ブログ用途では「Public」で作成し、マーケットプレイスに公開せず
> Preview/Development モードのみで使う方法が現実的。**
> （レビューなし・公開なしで個人利用可能）

---

## Step 1 — Canva CLI のインストールとログイン

```bash
npm install -g @canva/cli@latest
canva login
```

- ブラウザが開き、Canva への認証画面が表示される
- **「Allow」** をクリック
- ブラウザに表示された **確認コード** をコピー
- CLIのプロンプトに貼り付けてEnter

---

## Step 2 — Canva App の作成

```bash
canva apps create "概念ノートエクスポート" \
  --template="hello_world" \
  --distribution="public" \
  --git \
  --installDependencies
```

| フラグ | 説明 |
|---|---|
| `--template="hello_world"` | 最小構成のスターターテンプレート |
| `--distribution="public"` | マーケットプレイス公開可能（個人利用はPreviewのみ使用） |
| `--git` | Git リポジトリを初期化 |
| `--installDependencies` | npm install を自動実行 |

> ⚠️ **distribution はあとから変更不可**。Public で作成し、公開しないで使う。

作成後:
```bash
cd 概念ノートエクスポート
npm start
```

開発サーバーが `http://localhost:8080` で起動する。

---

## Step 3 — Developer Portal で App ID と UI 識別子を確認

### App ID の確認

1. [Canva Developer Portal](https://www.canva.com/developers/) → **Your apps** を開く
2. 作成したアプリ名の横に **App ID** が表示されている

### UI 識別子の確認（Deep Link 用）

> **重要**: Deep Link で使う `ui=` パラメータは **App ID とは別の値**。

1. Developer Portal → アプリをクリック → **「Preview」** ボタンをクリック
2. 新しいタブで Canva エディタが開く
3. アドレスバーの URL を確認:
   ```
   https://www.canva.com/design/...?ui=abCDEfg1HiJ_AbcdEFGhIjKlMnOPQRStUVwXYZA1b234C5DeFgHijK5
   ```
4. **`ui=` 以降の値** が UI 識別子（例: `abCDEfg1HiJ_...`）

---

## Step 4 — 環境変数の設定

### 重要: Canva App 側に「アップロードフォーム」は存在しない

Canva App は**サーバーを持たない静的バンドル（純粋なフロントエンド JS）**。
環境変数は Canva Developer Portal ではなく、
**ローカルの `.env` ファイルに書き、ビルド時にバンドルへ焼き込む**。

```
ローカルの .env
    ↓ npm run build（Vite がビルド時に展開）
bundle.js（VITE_API_URL の値が文字列として埋め込まれた状態）
    ↓ Developer Portal へアップロード
Canva のサーバー（静的ファイルとして配信するだけ）
```

Cloudflare Workers のように「ダッシュボードで Secret を設定」する場所はない。
バンドルに値が既に入っているため、Portal 側での設定は不要。

---

### apps/web（Next.js）

`apps/web/.env.local` に追加:

```env
# Canva App ID（Developer PortalのYour appsページで確認）
NEXT_PUBLIC_CANVA_APP_ID=your-app-id-here

# Canva App の UI 識別子（Step 3 の Preview URL から取得）
NEXT_PUBLIC_CANVA_UI_ID=abCDEfg1HiJ_...
```

### apps/canva-app（Canva App 本体）

`apps/canva-app/.env` を作成（Vite が自動で読み込む）:

```env
# Canva App ID（小文字）
CANVA_APP_ID=your-app-id-lowercase

# Hot Module Replacement を有効化（開発時のみ）
CANVA_HMR_ENABLED=TRUE

# 概念ノートブログのバックエンド URL
# ここに書いた値が npm run build 時にバンドルへ文字列として埋め込まれる
VITE_API_URL=http://localhost:8787
```

**本番ビルド時**は `.env` を書き換えてからビルド:

```bash
# .env を本番用に変更してからビルド
VITE_API_URL=https://your-api.workers.dev npm run build

# または .env.production ファイルを作成（Vite が自動で切り替え）
```

`apps/canva-app/.env.production`:
```env
CANVA_APP_ID=your-app-id-lowercase
VITE_API_URL=https://your-api.workers.dev
```

Vite は `npm run build` 時に `.env.production` を優先して読む。
開発中（`npm start`）は `.env` を使う。

### ソースコードでの参照方法（Canva App 内）

Vite 環境では `import.meta.env.VITE_*` で参照する（`process.env` ではない）:

```ts
// apps/canva-app/src/App.tsx
const API_URL = import.meta.env.VITE_API_URL as string;
```

> **注意**: `VITE_` プレフィックスのない変数はバンドルに含まれない（Vite の仕様）

---

## Step 5 — 開発サーバーを Developer Portal に登録

1. Developer Portal → アプリをクリック → **「Code upload」** ページを開く
2. **「App source」** ドロップダウン → **「Development URL」** を選択
3. **「Development URL」** フィールドに `http://localhost:8080` を入力
4. **「Preview」** をクリック → Canva エディタでアプリが開く
5. 初回のみ: Chrome のポップアップ（ローカルネットワークアクセス許可）→ **「Allow」**

以降は `npm start` で起動しておけばPreviewで動作確認できる。

---

## Step 6 — バックエンド（Cloudflare Workers）の CORS 設定

Canva App からバックエンドへ fetch するとき、リクエスト元は:

```
https://app-{canva-app-id}.canva-apps.com
```

（App ID は**すべて小文字**）

### apps/api の CORS 設定を更新

`apps/api/src/middleware/cors.ts` に Canva App のオリジンを追加:

```ts
// apps/api/src/middleware/cors.ts
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,                                    // 例: http://localhost:3001
  `https://app-${process.env.CANVA_APP_ID?.toLowerCase()}.canva-apps.com`,
];
```

`apps/api/wrangler.toml` に追加:

```toml
[vars]
FRONTEND_URL = "http://localhost:3001"
ADMIN_EMAIL = ""
CANVA_APP_ID = "your-app-id-here"
```

---

## Step 7 — Deep Link URL の確認

### 現在の実装（修正前の参考）

```
https://www.canva.com/apps/{APP_ID}?session=...&api=...
```

→ **この URL は App 情報ページを開くだけで App を起動しない**

### 正しい Deep Link フォーマット（公式）

新規デザインを開きつつ App パネルを開く:

```
https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26type%3D<TYPE-ID>%26ui%3D<APP-UI>
```

| パラメータ | 説明 | 取得方法 |
|---|---|---|
| `TYPE-ID` | デザインの種類（ホワイトボードなど） | Canva URL から確認 |
| `APP-UI` | UI 識別子 | Step 3 で取得 |

**ホワイトボードの TYPE-ID の例（要確認）:**
Canva でホワイトボードを新規作成し、URL に含まれる `type=` の値を確認する。

### apps/web の href を更新（UI 識別子確認後）

`new/page.tsx` と `edit/[id]/page.tsx` の概念作成リンク:

```tsx
// 変更前（機能しない）
href={`https://www.canva.com/apps/${process.env.NEXT_PUBLIC_CANVA_APP_ID ?? ""}?session=${sessionToken}&api=${apiOrigin}`}

// 変更後（Deep Link + セッション登録は別途 onClick で処理）
href={`https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26type%3D<TYPE-ID>%26ui%3D${process.env.NEXT_PUBLIC_CANVA_UI_ID ?? ""}`}
```

`.env.local` に追加:

```env
# Canva App の UI 識別子（Step 3 で確認）
NEXT_PUBLIC_CANVA_UI_ID=abCDEfg1HiJ_AbcdEFGhIjKlMnOPQRStUVwXYZA1b234C5DeFgHijK5
```

---

## Step 8 — Canva App のビルドと動作確認

### 開発中の動作確認

```bash
# 開発サーバー起動
npm start

# 診断ツール（依存関係の確認）
canva apps doctor
```

### 本番ビルド（Preview 用）

```bash
npm run build
```

1. Developer Portal → アプリ → **「Code upload」**
2. **「App source」** → **「Bundle」** を選択
3. **「Choose file」** → ビルドされたバンドルファイルを選択
4. **「Upload」**
5. **「Preview」** でテスト

---

## 設定値まとめ

| 変数名 | 設定場所 | 値の確認方法 |
|---|---|---|
| `NEXT_PUBLIC_CANVA_APP_ID` | `apps/web/.env.local` | Developer Portal → Your apps |
| `NEXT_PUBLIC_CANVA_UI_ID` | `apps/web/.env.local` | Preview URL の `ui=` パラメータ |
| `CANVA_APP_ID` | `apps/canva-app/.env` | Developer Portal → Your apps（小文字） |
| `VITE_API_URL` | `apps/canva-app/.env` | バックエンドの URL |
| `CANVA_APP_ID` | `apps/api/wrangler.toml` | Developer Portal → Your apps |

---

## 残作業（コード変更が必要）

Canva App は URL パラメータ（`?session=...`）を読めないため、セッション連携を
バックエンド経由で行う必要がある（`docs/issue/Canva_SDK_Investigation_2026-02-24.md` 参照）。

| タスク | 詳細 |
|---|---|
| `POST /api/canva-export/register` 追加 | フロントからセッションを事前登録 |
| `GET /api/canva-export/pending` 追加 | Canva App がセッション取得 |
| `apps/canva-app/src/App.tsx` 修正 | URL params 読み取りをバックエンド取得に変更 |
| `apps/web` のリンク href 修正 | Deep Link 形式に変更・onClick でセッション登録 |
| CORS ミドルウェア更新 | Canva App オリジンを許可リストに追加 |

---

## 参考リンク

- [Canva Apps SDK ドキュメント](https://www.canva.dev/docs/apps/)
- [クイックスタート](https://www.canva.dev/docs/apps/quickstart/)
- [Deep Linking](https://www.canva.dev/docs/apps/deep-linking/)
- [CORS 設定ガイド](https://www.canva.dev/docs/apps/cross-origin-resource-sharing/)
- [デザインのエクスポート](https://www.canva.dev/docs/apps/exporting-designs/)
- [アプリのプレビュー](https://www.canva.dev/docs/apps/previewing-apps/)
- [アプリの公開](https://www.canva.dev/docs/apps/publishing-apps/)
