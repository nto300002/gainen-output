import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { canva_export_tokens } from "../db/schema";
import type { Bindings } from "../types/env";

const app = new Hono<{ Bindings: Bindings }>();

// POST /api/canva-export
// Called by the Canva App after exporting a design.
// Receives: FormData { session_token: string, file: File }
// Saves the PNG to R2 and records the image_key against the session_token in D1.
app.post("/", async (c) => {
  const formData = await c.req.formData();

  const sessionToken = formData.get("session_token");
  if (!sessionToken || typeof sessionToken !== "string") {
    throw new HTTPException(400, { message: "session_token is required" });
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    throw new HTTPException(400, { message: "file is required" });
  }

  const file = fileEntry as File;
  const buffer = await file.arrayBuffer();

  const uuid = crypto.randomUUID();
  const key = `images/canva/${uuid}.png`;

  await c.env.BUCKET.put(key, buffer, {
    httpMetadata: { contentType: "image/png" },
  });

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

  const db = createDb(c.env.DB);
  await db
    .insert(canva_export_tokens)
    .values({ session_token: sessionToken, image_key: key, expires_at: expiresAt })
    .run();

  return c.json({ ok: true, image_key: key }, 201);
});

// GET /api/canva-export/poll?session=<token>
// Polled by the frontend every few seconds.
// Returns { image_key } once available, or { pending: true } while waiting.
app.get("/poll", async (c) => {
  const session = c.req.query("session");
  if (!session) {
    throw new HTTPException(400, { message: "session query param is required" });
  }

  const db = createDb(c.env.DB);
  const row = await db
    .select()
    .from(canva_export_tokens)
    .where(eq(canva_export_tokens.session_token, session))
    .get();

  if (!row || !row.image_key) {
    return c.json({ pending: true });
  }

  return c.json({ image_key: row.image_key });
});

export { app as canvaExportRouter };
