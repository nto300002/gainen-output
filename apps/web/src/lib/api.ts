import type { PostWithRelations, Category, Tag } from "@/types";

// サーバー側（Server Component）: Workers を直接呼ぶ
// クライアント側（"use client"）: "" = relative URL → Next.js rewrites でプロキシ
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:8787")
    : "";

// タイトルから slug を生成（英数字 + ハイフン、末尾にユニーク suffix を付与）
function generateSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Date.now().toString(36);
  return ascii ? `${ascii}-${suffix}` : suffix;
}

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getPosts(): Promise<PostWithRelations[]> {
  return fetcher<PostWithRelations[]>("/api/posts");
}

export async function getPost(slug: string): Promise<PostWithRelations> {
  return fetcher<PostWithRelations>(`/api/posts/${slug}`);
}

export async function getCategories(): Promise<Category[]> {
  return fetcher<Category[]>("/api/categories");
}

export async function getTags(): Promise<Tag[]> {
  return fetcher<Tag[]>("/api/tags");
}

type CreatePostInput = {
  title: string;
  body: string;
  status: "draft" | "published";
  category_id: string | null;
  tag_ids: string[];
  image_key?: string | null;
};

export async function createPost(data: CreatePostInput): Promise<PostWithRelations> {
  const { tag_ids, ...rest } = data;

  // slug を自動生成して POST
  const post = await fetcher<PostWithRelations & { id: string }>("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...rest, slug: generateSlug(rest.title) }),
  });

  // タグを別エンドポイントで保存
  if (tag_ids && tag_ids.length > 0) {
    await fetcher(`/api/posts/${post.id}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_ids }),
    });
  }

  return post;
}

type UpdatePostInput = Partial<Omit<CreatePostInput, "tag_ids"> & { tag_ids: string[] }>;

export async function updatePost(id: string, data: UpdatePostInput): Promise<PostWithRelations> {
  const { tag_ids, ...rest } = data;

  const post = await fetcher<PostWithRelations>(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rest),
  });

  if (tag_ids !== undefined) {
    await fetcher(`/api/posts/${id}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_ids }),
    });
  }

  return post;
}

export async function createCategory(data: { name: string; slug: string }): Promise<Category> {
  return fetcher<Category>("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createTag(data: { name: string; slug: string }): Promise<Tag> {
  return fetcher<Tag>("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export type CanvaExportPollResult =
  | { image_key: string; pending?: never }
  | { pending: true; image_key?: never };

export async function pollCanvaExport(sessionToken: string): Promise<CanvaExportPollResult> {
  return fetcher<CanvaExportPollResult>(`/api/canva-export/poll?session=${encodeURIComponent(sessionToken)}`);
}

export async function deletePost(id: string): Promise<{ ok: boolean }> {
  return fetcher<{ ok: boolean }>(`/api/posts/${id}`, { method: "DELETE" });
}

export async function deleteCategory(id: string): Promise<void> {
  await fetcher<{ ok: boolean }>(`/api/categories/${id}`, { method: "DELETE" });
}

export async function deleteTag(id: string): Promise<void> {
  await fetcher<{ ok: boolean }>(`/api/tags/${id}`, { method: "DELETE" });
}

export async function uploadImage(file: File): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetcher<{ key: string; url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  });
}
