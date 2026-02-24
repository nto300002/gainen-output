# 環境変数一覧

**日時**: 2026-02-24

---

## Next.js (Vercel)

`apps/web/.env.local` / Vercel Dashboard → Settings → Environment Variables に設定する。

| 変数名 | 必須 | 説明 | 例 |
|---|---|---|---|
| `API_URL` | ✅ | Cloudflare Workers のデプロイ URL（SSR からの直接呼び出し & rewrites 転送先） | `https://gainen-api.nto300002.workers.dev` |
| `NEXT_PUBLIC_CANVA_APP_ID` | ✅ | Canva アプリ ID | `AAHAAFOACVM` |
| `NEXT_PUBLIC_CANVA_UI_ID` | ✅ | Canva UI ID (base64) | `eyJFIjp7...` |
| `CANVA_APP_ORIGIN` | ✅ | Canva アプリの origin (CORS 許可用) | `https://app-aahaafoacvm.canva-apps.com` |

> `NEXT_PUBLIC_` プレフィックスの変数はブラウザに公開される。
> `API_URL` はサーバーサイドのみ（`next.config.ts` の rewrites と Server Components で使用）。

---

## Cloudflare Workers

### `wrangler.toml` の `[vars]` (非機密)

| 変数名 | 説明 | 本番値 |
|---|---|---|
| `FRONTEND_URL` | Next.js の本番 URL（OAuth callback の redirect_uri 生成用） | `https://gainen-output.vercel.app` |
| `ADMIN_EMAIL` | 管理者メールアドレス（ログイン許可） | `samonkntd@gmail.com` |

### Wrangler Secrets (機密情報)

`wrangler secret put <KEY>` または Cloudflare Dashboard → Workers → Settings → Variables で設定する。

| 変数名 | 説明 |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 クライアント ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 クライアントシークレット |
| `SESSION_SECRET` | セッション署名用シークレット（任意の長い乱数文字列） |

### Cloudflare リソース

| リソース | binding | 本番名 |
|---|---|---|
| D1 Database | `DB` | `gainen-db` |
| R2 Bucket | `BUCKET` | `gainen-images` |

---

## ローカル開発用ファイル (.gitignore 済み)

| ファイル | 対象 | 内容 |
|---|---|---|
| `apps/web/.env.local` | Next.js | `API_URL`, `NEXT_PUBLIC_*`, `CANVA_*` |
| `apps/api/.dev.vars` | Workers | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL` |

---

## Vercel デプロイ時の設定

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm build`（デフォルト）
- **Install Command**: `pnpm install`（モノレポルートで実行される）
- **Node.js Version**: 22.x
