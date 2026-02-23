import { http, HttpResponse } from "msw";
import { mockPost, mockPinnedPost, mockDraftPost } from "../fixtures";
import type { PostWithRelations } from "@/types";

const allPosts: PostWithRelations[] = [mockPinnedPost, mockPost, mockDraftPost];

export const postsHandlers = [
  http.get("http://localhost/api/posts", () => {
    return HttpResponse.json(allPosts);
  }),

  http.get("http://localhost/api/posts/:slug", ({ params }) => {
    const { slug } = params;
    const post = allPosts.find((p) => p.slug === slug);
    if (!post) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(post);
  }),

  http.post("http://localhost/api/posts", async ({ request }) => {
    const body = (await request.json()) as Partial<PostWithRelations>;
    const newPost: PostWithRelations = {
      id: "post-new",
      title: body.title ?? "",
      slug: (body.title ?? "").toLowerCase().replace(/\s+/g, "-"),
      body: body.body ?? "",
      image_key: body.image_key ?? null,
      category_id: body.category_id ?? null,
      category_name: null,
      category_color: null,
      status: body.status ?? "draft",
      is_pinned: 0,
      sort_order: 99,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(newPost, { status: 201 });
  }),

  http.put("http://localhost/api/posts/:id", async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<PostWithRelations>;
    const post = allPosts.find((p) => p.id === id);
    if (!post) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = { ...post, ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(updated);
  }),
];
