import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// ─── Mock canva-sdk ──────────────────────────────────────────────────────────

jest.mock("../canva-sdk", () => ({
  canvaSDK: {
    exportContent: jest.fn(),
  },
}));

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setUrlParams(params: Record<string, string>) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...window.location,
      search: "?" + new URLSearchParams(params).toString(),
    },
  });
}

function makeExportResult(blobUrl = "blob:http://localhost/abc") {
  return {
    title: "My Design",
    exportBlobs: [{ url: blobUrl }],
  };
}

describe("App", () => {
  let canvaSDK: { exportContent: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    canvaSDK = require("../canva-sdk").canvaSDK;
    setUrlParams({ session: "test-session-token", api: "http://localhost:8787" });

    // Default: fetch for blob returns a blob, fetch for API returns ok
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(["img"], { type: "image/png" })),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, image_key: "images/canva/x.png" }) });
    });
  });

  it("renders the export button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /エクスポート/i })).toBeInTheDocument();
  });

  it("calls canvaSDK.exportContent when button is clicked", async () => {
    canvaSDK.exportContent.mockResolvedValue(makeExportResult());
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    expect(canvaSDK.exportContent).toHaveBeenCalledWith(
      expect.objectContaining({ acceptedFileTypes: ["PNG"] })
    );
  });

  it("shows loading state while exporting", async () => {
    let resolveExport!: (v: unknown) => void;
    canvaSDK.exportContent.mockReturnValue(new Promise((r) => { resolveExport = r; }));

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    expect(screen.getByRole("button")).toBeDisabled();

    resolveExport(makeExportResult());
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
  });

  it("POSTs to the API with session_token and file", async () => {
    canvaSDK.exportContent.mockResolvedValue(makeExportResult("blob:http://localhost/abc"));
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8787/api/canva-export",
        expect.objectContaining({ method: "POST" })
      )
    );

    const [, init] = mockFetch.mock.calls.find(
      ([url]: [string]) => url === "http://localhost:8787/api/canva-export"
    )!;
    const body = init.body as FormData;
    expect(body.get("session_token")).toBe("test-session-token");
    expect(body.get("file")).toBeInstanceOf(Blob);
  });

  it("shows success message after export completes", async () => {
    canvaSDK.exportContent.mockResolvedValue(makeExportResult());
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() =>
      expect(screen.getByText(/完了/i)).toBeInTheDocument()
    );
  });

  it("shows error message when canvaSDK throws", async () => {
    canvaSDK.exportContent.mockRejectedValue(new Error("SDK error"));
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() =>
      expect(screen.getByText(/失敗/i)).toBeInTheDocument()
    );
  });

  it("shows error message when API POST fails", async () => {
    canvaSDK.exportContent.mockResolvedValue(makeExportResult());
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(["img"], { type: "image/png" })),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() =>
      expect(screen.getByText(/失敗/i)).toBeInTheDocument()
    );
  });
});
