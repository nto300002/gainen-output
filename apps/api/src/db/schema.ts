import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ─── categories ───────────────────────────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().slice(0, 8)),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color"), // HEX e.g. #8B5CF6
  sort_order: integer("sort_order").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── posts ────────────────────────────────────────────────────────────────────

export const posts = sqliteTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().slice(0, 16)),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(), // Markdown
  image_key: text("image_key"), // R2 object key
  category_id: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  is_pinned: integer("is_pinned").notNull().default(0), // 1 = pinned
  sort_order: integer("sort_order").notNull().default(0),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── tags ─────────────────────────────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().slice(0, 8)),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  is_preset: integer("is_preset").notNull().default(0), // 1 = preset
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── post_tags (junction) ────────────────────────────────────────────────────

export const post_tags = sqliteTable(
  "post_tags",
  {
    post_id: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tag_id: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.post_id, t.tag_id] })],
);

// ─── post_relations (self-referencing M:N) ────────────────────────────────────

export const post_relations = sqliteTable(
  "post_relations",
  {
    source_id: text("source_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    target_id: text("target_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.source_id, t.target_id] })],
);

// ─── canva_export_tokens ──────────────────────────────────────────────────────

export const canva_export_tokens = sqliteTable("canva_export_tokens", {
  session_token: text("session_token").primaryKey(),
  image_key: text("image_key"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  expires_at: text("expires_at").notNull(),
});

export type CanvaExportToken = typeof canva_export_tokens.$inferSelect;

// ─── sessions ─────────────────────────────────────────────────────────────────

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // crypto.randomUUID()
  user_email: text("user_email").notNull(),
  expires_at: text("expires_at").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Session = typeof sessions.$inferSelect;
