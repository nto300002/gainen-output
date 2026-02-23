import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../db";
import { tags, post_tags } from "../db/schema";
import { eq, like, desc, sql } from "drizzle-orm";
import type { Bindings } from "../types/env";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Bindings }>();

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  is_preset: z.number().int().min(0).max(1).optional(),
});

// GET /api/tags  (q= でサジェスト)
app.get("/", async (c) => {
  const q = c.req.query("q");
  const db = createDb(c.env.DB);

  if (q) {
    const rows = await db
      .select()
      .from(tags)
      .where(like(tags.name, `${q}%`))
      .orderBy(desc(tags.is_preset), tags.name)
      .all();
    return c.json(rows);
  }

  const rows = await db
    .select()
    .from(tags)
    .orderBy(desc(tags.is_preset), tags.name)
    .all();
  return c.json(rows);
});

// POST /api/tags
app.post("/", authMiddleware(), zValidator("json", tagSchema), async (c) => {
  const data = c.req.valid("json");
  const db = createDb(c.env.DB);
  const [row] = await db.insert(tags).values(data).returning();
  return c.json(row, 201);
});

// DELETE /api/tags/:id
app.delete("/:id", authMiddleware(), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const deleted = await db.delete(tags).where(eq(tags.id, id)).returning();
  if (deleted.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

export { app as tagsRouter };
