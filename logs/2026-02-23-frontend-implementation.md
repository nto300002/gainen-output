# フロントエンド実装作業ログ

**日時**: 2026-02-23
**対象**: `apps/web` (Next.js 16 App Router)

---

## 実施内容

### Phase 0 — パッケージインストール
```
pnpm add next-themes react-markdown
pnpm add -D msw
```

### Phase 1 — テスト基盤構築

| ファイル | 内容 |
|---|---|
| `jest.polyfills.ts` | MSW v2 用 Web API polyfill (TextDecoder / Streams / BroadcastChannel / undici fetch) |
| `jest.config.ts` | async `getJestConfig()` でNext.jsのtransformIgnorePatternsを上書き |
| `jest.setup.ts` | MSWサーバーライフサイクル + `URL.createObjectURL` mock |
| `src/__tests__/mocks/fixtures.ts` | 共通テストデータ (mockPost, mockPinnedPost, mockDraftPost, mockCategory, mockTag) |
| `src/__tests__/mocks/handlers/posts.ts` | MSW: GET/POST/PUT /api/posts |
| `src/__tests__/mocks/handlers/categories.ts` | MSW: GET /api/categories |
| `src/__tests__/mocks/handlers/tags.ts` | MSW: GET /api/tags |
| `src/__tests__/mocks/handlers/upload.ts` | MSW: POST /api/upload |
| `src/__tests__/mocks/server.ts` | setupServer |
| `src/__tests__/mocks/next-image.tsx` | `<img>` スタブ |
| `src/__tests__/mocks/next-navigation.ts` | useRouter / usePathname / redirect スタブ |
| `src/__tests__/mocks/react-markdown.tsx` | シンプル div スタブ |

### Phase 2 — `src/lib/api.ts`
- `getPosts()`, `getPost(slug)`, `getCategories()`, `getTags()`, `createPost()`, `updatePost()`, `uploadImage()`
- デフォルト BASE_URL: `http://localhost:3001`

### Phase 3 — UI アトム
- `src/components/ui/dot-grid.tsx` — 背景ドットグリッド
- `src/components/ui/tag.tsx` — TagBadge (violet)
- `src/components/ui/category-badge.tsx` — CategoryBadge (dynamic color)

### Phase 4 — 複合コンポーネント
- `src/components/post-card.tsx` — Server Component, PIN表示, 画像対応
- `src/components/post-viewer.tsx` — Server Component, Markdown本文, 関連記事
- `src/components/image-uploader.tsx` — Client Component, ドロップゾーン, バリデーション
- `src/components/markdown-editor.tsx` — Client Component, Bold/H1ボタン

### Phase 5 — ページ
- `src/app/globals.css` — ダークモードトークン (.dark)
- `src/app/layout.tsx` — Noto Sans JP + JetBrains Mono + ThemeProvider
- `src/app/page.tsx` — ホーム (ピン留め順ソート)
- `src/components/category-filter.tsx` — Client Component, useState フィルター
- `src/app/posts/[slug]/page.tsx` — 記事詳細 + generateMetadata
- `src/app/admin/layout.tsx` — 管理ナビゲーション
- `src/app/admin/page.tsx` — ダッシュボード (公開/下書き件数)
- `src/app/admin/new/page.tsx` — 新規投稿フォーム
- `src/app/admin/edit/[id]/page.tsx` — 編集フォーム

### ポート変更 (3000 → 3001)
- `apps/web/package.json`: `dev`/`start` に `-p 3001` 追加
- `src/lib/api.ts`: デフォルト BASE_URL を `http://localhost:3001` に変更
- `src/__tests__/mocks/handlers/*.ts`: 全ハンドラーURLを `http://localhost:3001` に変更

---

## テスト結果

```
Test Suites: 16 passed, 16 total
Tests:       66 passed, 66 total
```

---

## 解決した技術的課題

### MSW v2 + jest-environment-jsdom + pnpm の組み合わせ問題

#### 問題1: `Response is not defined`
- **原因**: jest-environment-jsdom の vmコンテキストに Node.js の Web Fetch API が引き継がれない
- **解決**: `jest.polyfills.ts` を `setupFiles` に追加し、`require()` で順序制御して polyfill

#### 問題2: ESM `SyntaxError: Cannot use import statement`
- **原因**: jsdom が "browser" export condition を設定するため、MSW が browser版 `.mjs` を解決してしまう
- **解決**: `testEnvironmentOptions: { customExportConditions: [""] }` で browser条件を除外

#### 問題3: pnpm virtual store の `transformIgnorePatterns` が効かない
- **原因**: Next.js の `createJestConfig()` が `transformIgnorePatterns` を後から追加し、`geist` のみを除外するパターンで上書きしてしまう
- **解決**: `jest.config.ts` を async 関数でラップし、`createJestConfig()` の結果を後処理して `transformIgnorePatterns` を差し替え

#### 問題4: `BroadcastChannel is not defined`
- **原因**: MSW の `ws.ts` が `BroadcastChannel` を使用するが jsdom に未実装
- **解決**: `jest.polyfills.ts` で `node:worker_threads` から polyfill

#### 問題5: `URL.createObjectURL is not a function`
- **原因**: jsdom 26 が `URL.createObjectURL` を未実装
- **解決**: `jest.setup.ts` で `jest.fn()` として mock

#### 問題6: `react-markdown` のESM依存が多すぎる
- **原因**: `react-markdown` v10 のunified エコシステムは全てESM-only で依存が深い
- **解決**: `moduleNameMapper` で `react-markdown` を simple stub に差し替え

#### 問題7: `userEvent.upload` が `accept` 属性を尊重する
- **原因**: `@testing-library/user-event` v14 は `accept="image/*"` を見て非対象ファイルをブロックする
- **解決**: バリデーションテストでは `{ applyAccept: false }` オプションを使用
