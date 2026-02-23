import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Bindings } from "../types/env";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Bindings }>();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/upload
app.post("/", authMiddleware(), async (c) => {
  const formData = await c.req.formData();
  const entry = formData.get("file");

  if (!entry || typeof entry === "string") {
    throw new HTTPException(400, { message: "file field is required" });
  }

  const file = entry as File;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new HTTPException(400, {
      message: `Unsupported file type: ${file.type}`,
    });
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    throw new HTTPException(400, { message: "File exceeds 5MB limit" });
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : "jpg";

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  const key = `images/${year}/${month}/${uuid}.${ext}`;

  await c.env.BUCKET.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ key, url: `/api/images/${key}` }, 201);
});

export { app as uploadRouter };
