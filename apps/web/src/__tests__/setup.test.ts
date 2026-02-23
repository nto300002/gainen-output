/**
 * TDD環境の動作確認テスト
 * このテストが通れば Jest + React Testing Library のセットアップが完了
 */
describe("TDD環境セットアップ確認", () => {
  it("Jest が正常に動作する", () => {
    expect(true).toBe(true);
  });

  it("@testing-library/jest-dom のマッチャーが使える", () => {
    const div = document.createElement("div");
    div.textContent = "概念理解ノート";
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });
});
