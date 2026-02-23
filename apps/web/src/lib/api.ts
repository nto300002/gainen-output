import type { PostWithRelations, Category, Tag } from "@/types";

// サーバー側（Server Component）: Workers を直接呼ぶ
// クライアント側（"use client"）: "" = relative URL → Next.js rewrites でプロキシ
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:8787")
    : "";

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
  return fetcher<PostWithRelations>("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

type UpdatePostInput = Partial<Omit<CreatePostInput, "tag_ids"> & { tag_ids: string[] }>;

export async function updatePost(id: string, data: UpdatePostInput): Promise<PostWithRelations> {
  return fetcher<PostWithRelations>(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file: File): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetcher<{ key: string; url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  });
}
