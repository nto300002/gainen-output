# Claude Code Instructions

## 開発原則

### TDD (Test-Driven Development) - 必須
**全ての実装はTDDによって行う。例外なし。**

TDDサイクル:
1. **Red** - 失敗するテストを先に書く
2. **Green** - テストを通過する最小限のコードを書く
3. **Refactor** - コードをリファクタリングする

- 実装コードを書く前に必ずテストを書く
- テストのないコードは追加しない
- Reactコンポーネントには React Testing Library を使用する
