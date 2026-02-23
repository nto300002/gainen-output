import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDb } from "../db";
import { posts, categories, tags, post_tags } from "../db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import type { Bindings } from "../types/env";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Bindings }>();

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  body: z.string(),
  image_key: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
  is_pinned: z.number().int().min(0).max(1).optional(),
  sort_order: z.number().int().optional(),
});

// ─── GET /api/posts ───────────────────────────────────────────────────────────

app.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const tagSlug = c.req.query("tag");
  const statusFilter = c.req.query("status"); // admin only: draft | published

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      image_key: posts.image_key,
      status: posts.status,
      is_pinned: posts.is_pinned,
      sort_order: posts.sort_order,
      created_at: posts.created_at,
      updated_at: posts.updated_at,
      category_id: posts.category_id,
      category_name: categories.name,
      category_color: categories.color,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.category_id, categories.id))
    .where(eq(posts.status, statusFilter === "draft" ? "draft" : "published"))
    .orderBy(desc(posts.is_pinned), desc(posts.sort_order), desc(posts.created_at))
    .all();

  if (rows.length === 0) return c.json([]);

  // タグを一括取得（N+1 回避）
  const postIds = rows.map((r) => r.id);
  const allPostTags = await db
    .select({
      post_id: post_tags.post_id,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      is_preset: tags.is_preset,
      created_at: tags.created_at,
    })
    .from(post_tags)
    .innerJoin(tags, eq(post_tags.tag_id, tags.id))
    .where(inArray(post_tags.post_id, postIds))
    .all();

  // post_id ごとにグルーピング
  const tagsByPostId = allPostTags.reduce<Record<string, typeof allPostTags>>(
    (acc, t) => {
      (acc[t.post_id] ??= []).push(t);
      return acc;
    },
    {},
  );

  const result = rows.map((r) => ({ ...r, tags: tagsByPostId[r.id] ?? [] }));

  // タグスラッグで絞り込み
  if (tagSlug) {
    return c.json(result.filter((r) => r.tags.some((t) => t.slug === tagSlug)));
  }

  return c.json(result);
});

// ─── GET /api/posts/:slug ─────────────────────────────────────────────────────

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createDb(c.env.DB);

  const post = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      image_key: posts.image_key,
      status: posts.status,
      is_pinned: posts.is_pinned,
      sort_order: posts.sort_order,
      created_at: posts.created_at,
      updated_at: posts.updated_at,
      category_id: posts.category_id,
      category_name: categories.name,
      category_color: categories.color,
      category_slug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.category_id, categories.id))
    .where(eq(posts.slug, slug))
    .get();

  if (!post) return c.json({ error: "Not found" }, 404);

  // タグ取得
  const postTags = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(tags)
    .innerJoin(post_tags, eq(tags.id, post_tags.tag_id))
    .where(eq(post_tags.post_id, post.id))
    .all();

  return c.json({ ...post, tags: postTags });
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────

app.post("/", authMiddleware(), zValidator("json", postSchema), async (c) => {
  const data = c.req.valid("json");
  const db = createDb(c.env.DB);
  const [row] = await db.insert(posts).values(data).returning();
  return c.json(row, 201);
});

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────

app.put(
  "/:id",
  authMiddleware(),
  zValidator("json", postSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const db = createDb(c.env.DB);
    const now = new Date().toISOString();
    const [row] = await db
      .update(posts)
      .set({ ...data, updated_at: now })
      .where(eq(posts.id, id))
      .returning();
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  },
);

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────

app.delete("/:id", authMiddleware(), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const deleted = await db.delete(posts).where(eq(posts.id, id)).returning();
  if (deleted.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// ─── PUT /api/posts/:id/pin ───────────────────────────────────────────────────

app.put(
  "/:id/pin",
  authMiddleware(),
  zValidator("json", z.object({ is_pinned: z.number().int().min(0).max(1) })),
  async (c) => {
    const id = c.req.param("id");
    const { is_pinned } = c.req.valid("json");
    const db = createDb(c.env.DB);
    const [row] = await db
      .update(posts)
      .set({ is_pinned, updated_at: new Date().toISOString() })
      .where(eq(posts.id, id))
      .returning();
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  },
);

// ─── PUT /api/posts/:id/sort ──────────────────────────────────────────────────

app.put(
  "/:id/sort",
  authMiddleware(),
  zValidator("json", z.object({ sort_order: z.number().int() })),
  async (c) => {
    const id = c.req.param("id");
    const { sort_order } = c.req.valid("json");
    const db = createDb(c.env.DB);
    const [row] = await db
      .update(posts)
      .set({ sort_order, updated_at: new Date().toISOString() })
      .where(eq(posts.id, id))
      .returning();
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  },
);

// ─── PUT /api/posts/:id/tags ──────────────────────────────────────────────────

app.put(
  "/:id/tags",
  authMiddleware(),
  zValidator("json", z.object({ tag_ids: z.array(z.string()) })),
  async (c) => {
    const id = c.req.param("id");
    const { tag_ids } = c.req.valid("json");
    const db = createDb(c.env.DB);

    // 全洗い替え
    await db.delete(post_tags).where(eq(post_tags.post_id, id));
    if (tag_ids.length > 0) {
      await db
        .insert(post_tags)
        .values(tag_ids.map((tag_id) => ({ post_id: id, tag_id })));
    }

    return c.json({ ok: true });
  },
);

export { app as postsRouter };
