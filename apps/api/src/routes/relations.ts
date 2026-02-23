import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../db";
import { post_relations, posts } from "../db/schema";
import { eq, inArray, or, sql } from "drizzle-orm";
import type { Bindings } from "../types/env";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/posts/:id/relations  (双方向)
app.get("/:id/relations", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const relations = await db
    .select()
    .from(post_relations)
    .where(
      or(eq(post_relations.source_id, id), eq(post_relations.target_id, id)),
    )
    .all();

  const relatedIds = relations.map((r) =>
    r.source_id === id ? r.target_id : r.source_id,
  );

  if (relatedIds.length === 0) return c.json([]);

  const relatedPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
    })
    .from(posts)
    .where(inArray(posts.id, relatedIds))
    .all();

  return c.json(relatedPosts);
});

// PUT /api/posts/:id/relations  (全洗い替え)
app.put(
  "/:id/relations",
  authMiddleware(),
  zValidator(
    "json",
    z.object({ related_ids: z.array(z.string()) }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const { related_ids } = c.req.valid("json");
    const db = createDb(c.env.DB);

    // 既存リレーション削除
    await db
      .delete(post_relations)
      .where(
        or(eq(post_relations.source_id, id), eq(post_relations.target_id, id)),
      );

    if (related_ids.length > 0) {
      await db.insert(post_relations).values(
        related_ids.map((target_id) => ({ source_id: id, target_id })),
      );
    }

    return c.json({ ok: true });
  },
);

export { app as relationsRouter };
