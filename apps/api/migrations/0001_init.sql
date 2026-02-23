-- Migration: 0001_init
-- Created: 2026-02-22

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  color      TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  body          TEXT NOT NULL,
  image_key     TEXT,
  category_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  is_pinned     INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_slug             ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status_created   ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category         ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_sort             ON posts(is_pinned DESC, sort_order DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  is_preset  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_preset ON tags(is_preset);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);

CREATE TABLE IF NOT EXISTS post_relations (
  source_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (source_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_post_relations_target ON post_relations(target_id);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Preset tags
INSERT OR IGNORE INTO tags (name, slug, is_preset) VALUES
  ('UML',        'uml',        1),
  ('アルゴリズム', 'algorithm',  1),
  ('基本情報',    'fe-exam',    1),
  ('初心者向け',  'beginner',   1),
  ('Web',        'web',        1),
  ('Java',       'java',       1),
  ('Python',     'python',     1),
  ('Go',         'go',         1);
