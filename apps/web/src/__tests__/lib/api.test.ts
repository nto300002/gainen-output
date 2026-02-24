import {
  getPosts,
  getPost,
  getCategories,
  getTags,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
  deleteCategory,
  deleteTag,
  pollCanvaExport,
} from "@/lib/api";
import { mockPost, mockPinnedPost, mockDraftPost, mockCategory, mockTag, mockTag2 } from "@/__tests__/mocks/fixtures";

describe("API functions", () => {
  describe("getPosts", () => {
    it("returns PostWithRelations array", async () => {
      const posts = await getPosts();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts).toHaveLength(3);
      expect(posts[0]).toMatchObject({ id: mockPinnedPost.id });
    });
  });

  describe("getPost", () => {
    it("returns a single post by slug", async () => {
      const post = await getPost("understanding-react-hooks");
      expect(post).toMatchObject({ id: mockPost.id, title: mockPost.title });
    });

    it("throws an error for not-found slug", async () => {
      await expect(getPost("not-found")).rejects.toThrow();
    });
  });

  describe("getCategories", () => {
    it("returns Category array", async () => {
      const categories = await getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories[0]).toMatchObject({ id: mockCategory.id });
    });
  });

  describe("getTags", () => {
    it("returns Tag array", async () => {
      const tags = await getTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toHaveLength(2);
      expect(tags[0]).toMatchObject({ id: mockTag.id });
    });
  });

  describe("createPost", () => {
    it("returns the created post", async () => {
      const result = await createPost({
        title: "New Post",
        body: "Body content",
        status: "draft",
        category_id: null,
        tag_ids: [],
      });
      expect(result).toMatchObject({ title: "New Post", status: "draft" });
    });
  });

  describe("updatePost", () => {
    it("returns the updated post", async () => {
      const result = await updatePost("post-1", {
        title: "Updated Title",
      });
      expect(result).toMatchObject({ id: "post-1", title: "Updated Title" });
    });
  });

  describe("deletePost", () => {
    it("returns { ok: true } on success", async () => {
      const result = await deletePost("post-1");
      expect(result).toMatchObject({ ok: true });
    });
  });

  describe("uploadImage", () => {
    it("returns key and url after upload", async () => {
      const file = new File(["image"], "test.png", { type: "image/png" });
      const result = await uploadImage(file);
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("url");
    });
  });

  describe("deleteCategory", () => {
    it("resolves without error for existing id", async () => {
      await deleteCategory("cat-1");
    });
  });

  describe("deleteTag", () => {
    it("resolves without error for existing id", async () => {
      await deleteTag("tag-1");
    });
  });

  describe("pollCanvaExport", () => {
    it("returns pending:true when no export found", async () => {
      const result = await pollCanvaExport("no-result");
      expect(result).toEqual({ pending: true });
    });

    it("returns image_key when export is ready", async () => {
      const result = await pollCanvaExport("has-result");
      expect(result).toHaveProperty("image_key", "images/canva/export.png");
    });
  });
});
