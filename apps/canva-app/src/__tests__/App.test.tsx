import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// ─── Mock canva-sdk ──────────────────────────────────────────────────────────

jest.mock("../canva-sdk", () => ({
  canvaSDK: {
    requestExport: jest.fn(),
  },
}));

// ─── Mock config (API URL is baked in at build time via Vite, not URL params) ─

jest.mock("../config", () => ({
  API_URL: "http://localhost:8787",
}));

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setSessionParam(session: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...window.location,
      search: `?session=${session}`,
    },
  });
}

function makeExportResult(blobUrl = "blob:http://localhost/abc") {
  return {
    status: "completed" as const,
    title: "My Design",
    exportBlobs: [{ url: blobUrl }],
  };
}

describe("App", () => {
  let canvaSDK: { requestExport: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    canvaSDK = require("../canva-sdk").canvaSDK as { requestExport: jest.Mock };
    // session_token はURLパラメータ経由（暫定）。api は config.API_URL から取得
    setSessionParam("test-session-token");

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

  it("calls canvaSDK.requestExport when button is clicked", async () => {
    canvaSDK.requestExport.mockResolvedValue(makeExportResult());
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    expect(canvaSDK.requestExport).toHaveBeenCalledWith(
      expect.objectContaining({ acceptedFileTypes: ["PNG"] })
    );
  });

  it("shows loading state while exporting", async () => {
    let resolveExport!: (v: unknown) => void;
    canvaSDK.requestExport.mockReturnValue(new Promise((r) => { resolveExport = r; }));

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    expect(screen.getByRole("button")).toBeDisabled();

    resolveExport(makeExportResult());
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
  });

  it("POSTs to API_URL (from config, not URL params) with session_token and file", async () => {
    canvaSDK.requestExport.mockResolvedValue(makeExportResult("blob:http://localhost/abc"));
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    // The endpoint URL must come from config.API_URL, not from ?api= URL param
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
    canvaSDK.requestExport.mockResolvedValue(makeExportResult());
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() =>
      expect(screen.getByText(/完了/i)).toBeInTheDocument()
    );
  });

  it("shows error message when canvaSDK throws", async () => {
    canvaSDK.requestExport.mockRejectedValue(new Error("SDK error"));
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() =>
      expect(screen.getByText(/失敗/i)).toBeInTheDocument()
    );
  });

  it("does not POST to API when user aborts export", async () => {
    canvaSDK.requestExport.mockResolvedValue({ status: "aborted" });
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /エクスポート/i }));

    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows error message when API POST fails", async () => {
    canvaSDK.requestExport.mockResolvedValue(makeExportResult());
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
