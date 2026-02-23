import {
  getPosts,
  getPost,
  getCategories,
  getTags,
  createPost,
  updatePost,
  uploadImage,
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

  describe("uploadImage", () => {
    it("returns key and url after upload", async () => {
      const file = new File(["image"], "test.png", { type: "image/png" });
      const result = await uploadImage(file);
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("url");
    });
  });
});
