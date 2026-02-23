// ---- Category ----
export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sort_order: number;
  created_at: string;
};

// ---- Tag ----
export type Tag = {
  id: string;
  name: string;
  slug: string;
  is_preset: 0 | 1;
  created_at: string;
};

// ---- Post ----
export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  title: string;
  slug: string;
  body: string;
  image_key: string | null;
  category_id: string | null;
  status: PostStatus;
  is_pinned: 0 | 1;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PostWithRelations = Post & {
  category_name: string | null;
  category_color: string | null;
  tags: Tag[];
};

// ---- API response helpers ----
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
