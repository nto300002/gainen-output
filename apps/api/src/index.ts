import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Bindings } from "./types/env";
import { corsMiddleware } from "./middleware/cors";
import { postsRouter } from "./routes/posts";
import { categoriesRouter } from "./routes/categories";
import { tagsRouter } from "./routes/tags";
import { relationsRouter } from "./routes/relations";
import { uploadRouter } from "./routes/upload";
import { authRouter } from "./routes/auth";
import { canvaExportRouter } from "./routes/canva-export";

const app = new Hono<{ Bindings: Bindings }>();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use("*", corsMiddleware());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/api/posts", postsRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/tags", tagsRouter);
app.route("/api/posts", relationsRouter); // handles /:id/relations
app.route("/api/upload", uploadRouter);
app.route("/api/auth", authRouter);
app.route("/api/canva-export", canvaExportRouter);

// R2 image proxy
app.get("/api/images/*", async (c) => {
  const key = c.req.path.replace("/api/images/", "");
  const object = await c.env.BUCKET.get(key);
  if (!object) return c.json({ error: "Not found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body as ReadableStream, { headers });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
