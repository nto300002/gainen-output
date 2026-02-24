# Canva 連携 — 実装調査

## 目標

新規投稿画面の「概念作成」ボタンから Canva を開き、ユーザーが概念図を作成・ダウンロードした際に、アプリ側が自動検知してそのまま画像アップロード欄にセットする。

---

## 前提：ブラウザのセキュリティ制約

**Webブラウザは、他のサイト（Canva）でのダウンロードをアプリ側から検知できない。**
これはブラウザのセキュリティ基本原則（Cross-Origin Policy）であり、回避不可能。
「自動検知」を実現するには、Canva 側の API を通じてアプリとの接点を作る必要がある。

---

## 案 A：Canva Apps SDK（理想的・中難易度）

### 仕組み

Canva のデベロッパープラットフォームで「Canva App」を作成し、Canva の UI 内に
「概念ノートへエクスポート」ボタンを追加する。

```
ユーザー が Canva で概念図を作成
    → Canva 内の「概念ノートへエクスポート」ボタンをクリック
    → Canva Apps SDK が PNG/WebP を取得
    → アプリのバックエンド (POST /api/upload) へ直接送信
    → フロントエンドが WebSocket or ポーリングで新しい image_key を受信
    → 画像アップロード欄に自動セット
```

### 実装ステップ

1. [Canva Developer Portal](https://www.canva.com/developers/) でアプリ登録
2. Canva App（React ベース）を作成、`@canva/asset` SDK で design を PNG として取得
3. バックエンドへ multipart POST で画像送信
4. フロントエンド側：`useEffect` + `EventSource`（SSE）or `WebSocket` で
   アップロード完了を待ち受け、`setImageKey` / `setImagePreview` をセット

### Canva App 側のコア（参考）

```ts
// canva-app/src/App.tsx
import { exportContent } from "@canva/design";
import { upload } from "@canva/asset";

async function handleExport() {
  const { exportBlobs } = await exportContent({ acceptedFileTypes: ["PNG"] });
  const blob = exportBlobs[0].url;
  // → fetch(blob) して FormData でアプリ API へ POST
  await fetch("https://your-app.example.com/api/canva-export", {
    method: "POST",
    body: formData,
  });
}
```

### 評価

| 項目 | 評価 |
|---|---|
| 実現可能性 | ○ 公式サポート |
| UX | ◎ ボタン1つで完結 |
| 実装コスト | 中（Canva App + SSE/WebSocket 追加） |
| Canva App 審査 | 必要（社内利用なら Private App で審査不要） |
| Canva Developer 登録 | 必要 |

**Private App（社内・個人利用）なら審査なしで即利用可能。**
→ 現状のユースケース（個人ブログ）では最も現実的なアプローチ。

---

## 案 B：Clipboard ペースト（最速・低コスト）

### 仕組み

Canva の「コピー」機能でクリップボードにコピーし、アプリ側でペーストを受け取る。

```
ユーザーが Canva で概念図を選択 → Ctrl+C / 右クリック「コピー」
    → アプリの画像エリアにフォーカスして Ctrl+V
    → onPaste イベントで Blob を取得
    → そのまま uploadImage() を呼び出して image_key をセット
```

### 実装（new/page.tsx への追加のみ）

```tsx
// new/page.tsx の画像アップロード <div> に追加
<div
  onPaste={async (e) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageLoading(true);
    try {
      const result = await uploadImage(file);
      setImageKey(result.key);
    } finally {
      setImageLoading(false);
    }
  }}
>
  {/* 既存の画像プレビュー・ボタン */}
</div>
```

### 評価

| 項目 | 評価 |
|---|---|
| 実現可能性 | ◎ 今すぐ実装可能 |
| UX | △ 「Ctrl+V」の一手間が必要 |
| 実装コスト | 低（10 行程度） |
| Canva 側の作業 | 不要 |
| 外部依存 | なし |

---

## 案 C：ドラッグ & ドロップ（低コスト・直感的）

### 仕組み

Canva からダウンロードしたファイルをブラウザにドラッグして渡す。

```
ユーザーが Canva でエクスポート（PNG ダウンロード）
    → ダウンロードしたファイルをアプリの画像エリアにドラッグ
    → onDrop で File を取得 → uploadImage()
```

現在の画像エリアに `onDragOver` / `onDrop` ハンドラを追加するだけ。
ファイルピッカーよりワンステップ少なく、直感的。

### 評価

| 項目 | 評価 |
|---|---|
| 実現可能性 | ◎ 今すぐ実装可能 |
| UX | △〜○ ダウンロード後のひと手間は残る |
| 実装コスト | 低（15 行程度） |

---

## 案 D：Canva Connect API（将来拡張）

Canva の OAuth 連携で設計データを API 経由で取得するアプローチ。
ユーザーが Canva アカウントを連携するとデザイン一覧を読み込んで選択できる。

- 実装コスト：高（OAuth フロー、Canva Connect API の申請、バックエンド実装）
- 審査が必要で承認に時間がかかる可能性あり
- 個人ブログ規模では過剰

---

## 推奨ロードマップ

### Phase 1（即実装・今すぐ）
**案 B（ペースト）+ 案 C（ドラッグ&ドロップ）を同時実装**

- コスト：合わせて 30 行程度
- UX 改善効果が大きく、Canva に限らず任意の画像ソースに対応
- 「Canva でコピー → アプリにペースト」のフローをドキュメント/UI に案内

### Phase 2（将来・本格統合）
**案 A（Canva Apps SDK / Private App）**

- Canva Developer Portal で Private App を登録
- 「概念ノートへ送る」ボタンを Canva 内に設置
- アプリ側に SSE エンドポイントを追加し、ボタン1クリックで自動セット実現

---

## 現在の「概念作成」ボタン URL について

現在 `https://www.canva.com/` へのベタリンクになっている。
将来 Canva App を作成した場合、そのアプリの固有 URL に差し替える：

```
https://www.canva.com/apps/{app-id}
```

または特定テンプレートを開く URL パラメータを使ってデザインテンプレートを指定することも可能。
