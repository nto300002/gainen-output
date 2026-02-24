import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be hoisted before importing the route
vi.mock("../../db", () => ({ createDb: vi.fn() }));

import { createDb } from "../../db";
import { canvaExportRouter } from "../../routes/canva-export";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Bindings } from "../../types/env";

// ─── Mock DB factory ──────────────────────────────────────────────────────────

function makeMockDb({ tokenRow = null }: { tokenRow?: Record<string, unknown> | null } = {}) {
  const get = vi.fn().mockResolvedValue(tokenRow);
  const where = vi.fn().mockReturnValue({ get });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });

  const run = vi.fn().mockResolvedValue({ success: true });
  const valuesInsert = vi.fn().mockReturnValue({ run });
  const insert = vi.fn().mockReturnValue({ values: valuesInsert });

  return { select, insert, _mocks: { get, where, from, run, valuesInsert } };
}

// ─── Mock Bindings ────────────────────────────────────────────────────────────

function makeMockBucket() {
  return {
    put: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Test app ─────────────────────────────────────────────────────────────────

function buildApp(mockEnv: Partial<Bindings> = {}) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route("/api/canva-export", canvaExportRouter);
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status);
    }
    return c.json({ error: "Internal Server Error" }, 500);
  });
  return { app, mockEnv };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/canva-export", () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let mockBucket: ReturnType<typeof makeMockBucket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = makeMockDb();
    mockBucket = makeMockBucket();
    vi.mocked(createDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createDb>);
  });

  it("returns 400 when session_token is missing", async () => {
    const { app, mockEnv } = buildApp({ BUCKET: mockBucket as unknown as R2Bucket });
    const formData = new FormData();
    formData.append("file", new Blob(["data"], { type: "image/png" }), "test.png");

    const res = await app.request(
      "/api/canva-export",
      { method: "POST", body: formData },
      mockEnv
    );

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/session_token/);
  });

  it("returns 400 when file is missing", async () => {
    const { app, mockEnv } = buildApp({ BUCKET: mockBucket as unknown as R2Bucket });
    const formData = new FormData();
    formData.append("session_token", "tok-abc");

    const res = await app.request(
      "/api/canva-export",
      { method: "POST", body: formData },
      mockEnv
    );

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/file/);
  });

  it("returns 201 with image_key when session_token + file are provided", async () => {
    const { app, mockEnv } = buildApp({
      DB: {} as D1Database,
      BUCKET: mockBucket as unknown as R2Bucket,
    });

    const formData = new FormData();
    formData.append("session_token", "tok-abc");
    formData.append("file", new Blob(["data"], { type: "image/png" }), "export.png");

    const res = await app.request(
      "/api/canva-export",
      { method: "POST", body: formData },
      mockEnv
    );

    expect(res.status).toBe(201);
    const body = await res.json() as { ok: boolean; image_key: string };
    expect(body.ok).toBe(true);
    expect(body.image_key).toMatch(/^images\/canva\//);
  });

  it("saves image to R2 bucket", async () => {
    const { app, mockEnv } = buildApp({
      DB: {} as D1Database,
      BUCKET: mockBucket as unknown as R2Bucket,
    });

    const formData = new FormData();
    formData.append("session_token", "tok-abc");
    formData.append("file", new Blob(["data"], { type: "image/png" }), "export.png");

    await app.request(
      "/api/canva-export",
      { method: "POST", body: formData },
      mockEnv
    );

    expect(mockBucket.put).toHaveBeenCalledOnce();
    const [key] = mockBucket.put.mock.calls[0];
    expect(key).toMatch(/^images\/canva\//);
  });

  it("persists session_token and image_key in DB", async () => {
    const { app, mockEnv } = buildApp({
      DB: {} as D1Database,
      BUCKET: mockBucket as unknown as R2Bucket,
    });

    const formData = new FormData();
    formData.append("session_token", "tok-save");
    formData.append("file", new Blob(["data"], { type: "image/png" }), "export.png");

    await app.request(
      "/api/canva-export",
      { method: "POST", body: formData },
      mockEnv
    );

    expect(mockDb.insert).toHaveBeenCalledOnce();
    const [insertedValues] = mockDb._mocks.valuesInsert.mock.calls[0];
    expect(insertedValues.session_token).toBe("tok-save");
    expect(insertedValues.image_key).toMatch(/^images\/canva\//);
  });
});

describe("GET /api/canva-export/poll", () => {
  let mockDb: ReturnType<typeof makeMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = makeMockDb();
    vi.mocked(createDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createDb>);
  });

  it("returns { pending: true } when session_token has no result yet", async () => {
    const { app, mockEnv } = buildApp({ DB: {} as D1Database });

    const res = await app.request(
      "/api/canva-export/poll?session=tok-pending",
      {},
      mockEnv
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { pending: boolean };
    expect(body.pending).toBe(true);
  });

  it("returns { image_key } when session_token has a result", async () => {
    mockDb = makeMockDb({ tokenRow: { session_token: "tok-done", image_key: "images/canva/abc.png" } });
    vi.mocked(createDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createDb>);

    const { app, mockEnv } = buildApp({ DB: {} as D1Database });

    const res = await app.request(
      "/api/canva-export/poll?session=tok-done",
      {},
      mockEnv
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { image_key: string };
    expect(body.image_key).toBe("images/canva/abc.png");
  });

  it("returns 400 when session query param is missing", async () => {
    const { app, mockEnv } = buildApp({ DB: {} as D1Database });

    const res = await app.request("/api/canva-export/poll", {}, mockEnv);

    expect(res.status).toBe(400);
  });
});
