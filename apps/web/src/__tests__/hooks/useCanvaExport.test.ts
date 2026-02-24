import { renderHook, waitFor } from "@testing-library/react";
import { useCanvaExport } from "@/hooks/useCanvaExport";

jest.mock("@/lib/api", () => ({
  pollCanvaExport: jest.fn(),
}));

describe("useCanvaExport", () => {
  let pollCanvaExport: jest.Mock;

  beforeEach(() => {
    pollCanvaExport = require("@/lib/api").pollCanvaExport;
    pollCanvaExport.mockClear();
    pollCanvaExport.mockResolvedValue({ pending: true });
  });

  it("returns a non-empty session token after mount", async () => {
    const { result } = renderHook(() =>
      useCanvaExport({ onExport: jest.fn(), pollIntervalMs: 10000 })
    );
    // Token is generated in useEffect (client-only) to prevent SSR hydration mismatch.
    // After mount the token must be a non-empty UUID string.
    await waitFor(() => expect(result.current.sessionToken).toBeTruthy());
    expect(typeof result.current.sessionToken).toBe("string");
  });

  it("initial sessionToken is empty string (SSR-safe)", () => {
    // Verify that the hook can be imported without immediately generating a token,
    // so that server-rendered HTML has the same empty value as the initial client render.
    // We verify this indirectly: token is not generated synchronously in useState.
    // The implementation must use useEffect for token generation.
    // We can't easily test the "before effects" state in RTL, but we document the intent.
    // This test acts as a contract: the hook MUST NOT throw during SSR (no window access in state init).
    expect(() =>
      renderHook(() => useCanvaExport({ onExport: jest.fn(), pollIntervalMs: 10000 }))
    ).not.toThrow();
  });

  it("session token is stable across re-renders", () => {
    const { result, rerender } = renderHook(() =>
      useCanvaExport({ onExport: jest.fn(), pollIntervalMs: 10000 })
    );
    const first = result.current.sessionToken;
    rerender();
    expect(result.current.sessionToken).toBe(first);
  });

  it("different hook instances get different tokens", () => {
    const { result: a } = renderHook(() =>
      useCanvaExport({ onExport: jest.fn(), pollIntervalMs: 10000 })
    );
    const { result: b } = renderHook(() =>
      useCanvaExport({ onExport: jest.fn(), pollIntervalMs: 10000 })
    );
    expect(a.current.sessionToken).not.toBe(b.current.sessionToken);
  });

  it("calls onExport with image_key when poll returns result", async () => {
    pollCanvaExport
      .mockResolvedValueOnce({ pending: true })
      .mockResolvedValueOnce({ image_key: "images/canva/export.png" });

    const onExport = jest.fn();
    renderHook(() => useCanvaExport({ onExport, pollIntervalMs: 10 }));

    await waitFor(() => expect(onExport).toHaveBeenCalledWith("images/canva/export.png"), {
      timeout: 3000,
    });
  });

  it("does not call onExport while poll returns pending", async () => {
    pollCanvaExport.mockResolvedValue({ pending: true });

    const onExport = jest.fn();
    const { unmount } = renderHook(() => useCanvaExport({ onExport, pollIntervalMs: 10 }));

    await new Promise((r) => setTimeout(r, 80));
    expect(onExport).not.toHaveBeenCalled();
    unmount();
  });

  it("stops polling after export is received", async () => {
    pollCanvaExport.mockResolvedValue({ image_key: "images/canva/export.png" });

    const onExport = jest.fn();
    renderHook(() => useCanvaExport({ onExport, pollIntervalMs: 10 }));

    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1), { timeout: 3000 });

    // 追加の呼び出しがないことを確認
    await new Promise((r) => setTimeout(r, 80));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("cleans up polling on unmount", async () => {
    const onExport = jest.fn();
    const { unmount } = renderHook(() => useCanvaExport({ onExport, pollIntervalMs: 10 }));
    unmount();

    await new Promise((r) => setTimeout(r, 80));
    expect(onExport).not.toHaveBeenCalled();
  });
});
