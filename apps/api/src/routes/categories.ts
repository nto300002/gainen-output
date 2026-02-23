import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../db";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Bindings } from "../types/env";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Bindings }>();

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sort_order: z.number().int().optional(),
});

// GET /api/categories
app.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db
    .select()
    .from(categories)
    .orderBy(categories.sort_order, categories.name)
    .all();
  return c.json(rows);
});

// POST /api/categories
app.post("/", authMiddleware(), zValidator("json", categorySchema), async (c) => {
  const data = c.req.valid("json");
  const db = createDb(c.env.DB);
  const [row] = await db.insert(categories).values(data).returning();
  return c.json(row, 201);
});

// PUT /api/categories/:id
app.put("/:id", authMiddleware(), zValidator("json", categorySchema.partial()), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const db = createDb(c.env.DB);
  const [row] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// DELETE /api/categories/:id
app.delete("/:id", authMiddleware(), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const deleted = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();
  if (deleted.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

export { app as categoriesRouter };
