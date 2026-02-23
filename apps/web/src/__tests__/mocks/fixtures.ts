import type { Category, Tag, PostWithRelations } from "@/types";

export const mockCategory: Category = {
  id: "cat-1",
  name: "JavaScript",
  slug: "javascript",
  color: "#F7DF1E",
  sort_order: 1,
  created_at: "2024-01-01T00:00:00.000Z",
};

export const mockTag: Tag = {
  id: "tag-1",
  name: "React",
  slug: "react",
  is_preset: 1,
  created_at: "2024-01-01T00:00:00.000Z",
};

export const mockTag2: Tag = {
  id: "tag-2",
  name: "TypeScript",
  slug: "typescript",
  is_preset: 1,
  created_at: "2024-01-01T00:00:00.000Z",
};

export const mockPost: PostWithRelations = {
  id: "post-1",
  title: "Understanding React Hooks",
  slug: "understanding-react-hooks",
  body: "# Understanding React Hooks\n\nReact Hooks allow you to use state in functional components.",
  image_key: null,
  category_id: "cat-1",
  category_name: "JavaScript",
  category_color: "#F7DF1E",
  status: "published",
  is_pinned: 0,
  sort_order: 1,
  tags: [mockTag],
  created_at: "2024-01-15T00:00:00.000Z",
  updated_at: "2024-01-15T00:00:00.000Z",
};

export const mockPinnedPost: PostWithRelations = {
  id: "post-2",
  title: "Getting Started with TypeScript",
  slug: "getting-started-with-typescript",
  body: "# Getting Started with TypeScript\n\nTypeScript adds static typing to JavaScript.",
  image_key: "images/typescript-cover.png",
  category_id: "cat-1",
  category_name: "JavaScript",
  category_color: "#F7DF1E",
  status: "published",
  is_pinned: 1,
  sort_order: 0,
  tags: [mockTag, mockTag2],
  created_at: "2024-01-10T00:00:00.000Z",
  updated_at: "2024-01-10T00:00:00.000Z",
};

export const mockDraftPost: PostWithRelations = {
  id: "post-3",
  title: "Draft Post",
  slug: "draft-post",
  body: "This is a draft.",
  image_key: null,
  category_id: null,
  category_name: null,
  category_color: null,
  status: "draft",
  is_pinned: 0,
  sort_order: 2,
  tags: [],
  created_at: "2024-01-20T00:00:00.000Z",
  updated_at: "2024-01-20T00:00:00.000Z",
};
