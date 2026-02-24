# Canva Apps SDK 調査ログ — 2026-02-24

## 発生した問題

1. React ハイドレーションエラー（セッションIDのズレ）
2. 「概念作成」ボタンが Canva App ではなく通常のCanvaダッシュボードを開く

---

## 調査結果

### 問題 1: セッションIDのズレ（ハイドレーション）

#### 原因 A: `useState(() => crypto.randomUUID())`

`useState` の初期化関数は SSR とクライアントの**両方**で実行される。
`crypto.randomUUID()` は毎回異なる値を返すため、生成された UUID が SSR とクライアントで一致しない。

```
SSR:    sessionToken = "uuid-A"  → HTML: <a href="...?session=uuid-A">
Client: sessionToken = "uuid-B"  → React: href="...?session=uuid-B"
→ ハイドレーション不一致
```

**修正済み（2026-02-24）**: `useEffect` 内でトークンを生成するよう変更。
```ts
// Before
const [sessionToken] = useState(() => crypto.randomUUID());

// After
const [sessionToken, setSessionToken] = useState<string>("");
useEffect(() => { setSessionToken(crypto.randomUUID()); }, []);
```

#### 原因 B: `typeof window !== "undefined" ? window.location.origin : ""`（未修正）

`api` パラメータも同様の問題がある。

```
SSR:    api=""
Client: api="http://localhost:3001"
→ ハイドレーション不一致が残存
```

**対応**: `api` パラメータも `useEffect` 内でのみ設定する。

---

### 問題 2: Canva App URL フォーマット

#### 現在の実装（誤り）

```tsx
href={`https://www.canva.com/apps/${APP_ID}?session=${token}&api=${origin}`}
```

この URL は Canva の App マーケットプレイス/情報ページを開くだけで、
App を起動してデザインエディタ内に表示させるものではない。

#### 正しい Deep Link フォーマット（公式ドキュメント）

```
https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26type%3D<TYPE-ID>%26ui%3D<APP-UI>
```

| パラメータ | 説明 |
|---|---|
| `type` | デザインタイプのID（例: ホワイトボード） |
| `ui` | Canva App の `ui` 識別子（アプリプレビュー時のアドレスバーから取得） |

参考: https://www.canva.dev/docs/apps/deep-linking/

---

### 問題 3: URL パラメータが Canva App に届かない

**重要**: Canva Apps はサンドボックス化されたiframe内で動作するため、
`window.location.search` を読んでも**カスタムURLパラメータは取得できない**。

現在の実装でセッショントークンを `?session=...&api=...` として渡しているが、
Canva App 内の `new URLSearchParams(window.location.search)` は機能しない。

#### Canva App が外部データを受け取る手段（公式）

| 手段 | 説明 |
|---|---|
| `auth.getCanvaUserToken()` | CanvaユーザーのJWT（バックエンドで検証） |
| `getCurrentPageContext()` | 現在のデザイン/ページ情報 |
| バックエンド API 経由 | アプリ独自の REST API を fetch() で呼び出す |

**結論**: URL パラメータ経由のセッション渡しは機能しない。
代替策: **バックエンドにセッションを事前登録 → Canva App がバックエンドから取得**。

---

### 問題 4: exportContent API が存在しない

#### 現在の実装（誤り）

```ts
import { exportContent } from "@canva/design";
// → This API does not exist in @canva/design v2+
```

#### 正しい API（公式ドキュメント）

```ts
import { requestExport } from "@canva/design";

const response = await requestExport({
  acceptedFileTypes: ["png"],
});
```

#### 正しい戻り値の型

```ts
// 成功
{ status: "completed", title?: string, exportBlobs: [{ url: string }] }
// ユーザーがキャンセル
{ status: "aborted" }
```

- `exportBlobs[].url` は**60分で失効する**一時URL
- 公式推奨: URLをすぐにバックエンドへ送り、ファイルをダウンロードさせる

参考: https://www.canva.dev/docs/apps/exporting-designs/

---

## 修正アーキテクチャ

### 旧アーキテクチャ（機能しない）

```
Frontend (onClick) → href="https://www.canva.com/apps/{id}?session=uuid&api=origin"
                                ↓（URL パラメータは届かない）
Canva App:  window.location.search → ❌ 空
            exportContent()        → ❌ API 存在しない
            POST /api/canva-export with session_token → ❌
```

### 新アーキテクチャ

```
1. Frontend: useEffect でセッショントークン生成（SSRセーフ）

2. Frontend (onClick "概念作成"):
   → POST /api/canva-export/register { session_token }
   → 新規タブで Canva を開く（Deep Link）

3. Canva App 起動後:
   → GET /api/canva-export/pending  ← バックエンドから最新のpendingセッション取得
   → requestExport({ acceptedFileTypes: ["png"] })
   → fetch(exportBlobs[0].url) でblobを取得
   → POST /api/canva-export { session_token, file }

4. Frontend: GET /api/canva-export/poll?session={token} でポーリング
   → { image_key } が返ったら画像セット
```

### 必要なバックエンド変更

| エンドポイント | 変更内容 |
|---|---|
| `POST /api/canva-export/register` | 新規追加: pendingセッション登録 |
| `GET /api/canva-export/pending` | 新規追加: 最新のpendingセッション取得（Canva App用） |
| `POST /api/canva-export` | 変更: INSERT → UPSERT（セッションが既存の場合は image_key を更新） |
| `GET /api/canva-export/poll` | 変更なし |

---

## 環境変数

| 変数 | 用途 | 現状 |
|---|---|---|
| `NEXT_PUBLIC_CANVA_APP_ID` | Deep Link の `ui` パラメータ | 未設定 |
| `VITE_API_URL` (Canva App) | POST先のバックエンドURL | 未設定（要追加） |

---

## 参考リンク

- [Deep linking — Canva Apps SDK](https://www.canva.dev/docs/apps/deep-linking/)
- [Exporting designs — Canva Apps SDK](https://www.canva.dev/docs/apps/exporting-designs/)
- [requestExport API Reference](https://www.canva.dev/docs/apps/api/latest/design-request-export/)
- [Authenticating users — Canva Apps SDK](https://www.canva.dev/docs/apps/authenticating-users/)
