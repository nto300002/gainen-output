import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditPostPage from "@/app/admin/(protected)/edit/[id]/page";
import { mockPost, mockPinnedPost } from "@/__tests__/mocks/fixtures";

jest.mock("@/hooks/useCanvaExport", () => ({
  useCanvaExport: jest.fn(() => ({ sessionToken: "test-session-edit" })),
}));

jest.mock("@/lib/api", () => ({
  getPost: jest.fn().mockResolvedValue(require("@/__tests__/mocks/fixtures").mockPost),
  getCategories: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockCategory]),
  getTags: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockTag]),
  updatePost: jest.fn().mockResolvedValue({ ...require("@/__tests__/mocks/fixtures").mockPost, title: "Updated" }),
  uploadImage: jest.fn().mockResolvedValue({ key: "images/test.png", url: "https://cdn.test/test.png" }),
  deleteCategory: jest.fn().mockResolvedValue(undefined),
  deleteTag: jest.fn().mockResolvedValue(undefined),
}));

const params = Promise.resolve({ id: "post-1" });

describe("EditPostPage", () => {
  it("loads form with existing title", async () => {
    render(<EditPostPage params={params} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue(mockPost.title)).toBeInTheDocument()
    );
  });

  it("loads form with existing tags selected", async () => {
    render(<EditPostPage params={params} />);
    await waitFor(() => screen.getByDisplayValue(mockPost.title));
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("calls updatePost on save", async () => {
    const { updatePost } = require("@/lib/api");
    render(<EditPostPage params={params} />);

    await waitFor(() => screen.getByDisplayValue(mockPost.title));
    await userEvent.click(screen.getByRole("button", { name: /save|保存|update|更新/i }));

    await waitFor(() =>
      expect(updatePost).toHaveBeenCalledWith(
        "post-1",
        expect.objectContaining({ title: mockPost.title })
      )
    );
  });

  describe("category delete", () => {
    let deleteCategory: jest.Mock;

    beforeEach(() => {
      deleteCategory = require("@/lib/api").deleteCategory;
      deleteCategory.mockClear();
    });

    it("renders delete button for each category", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "JavaScriptを削除" })).toBeInTheDocument()
      );
    });

    it("calls deleteCategory with the category id", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() => screen.getByRole("button", { name: "JavaScriptを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "JavaScriptを削除" }));
      expect(deleteCategory).toHaveBeenCalledWith("cat-1");
    });

    it("removes deleted category from the list", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() => screen.getByRole("button", { name: "JavaScriptを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "JavaScriptを削除" }));
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: "JavaScriptを削除" })).not.toBeInTheDocument()
      );
    });
  });

  describe("tag delete", () => {
    let deleteTag: jest.Mock;

    beforeEach(() => {
      deleteTag = require("@/lib/api").deleteTag;
      deleteTag.mockClear();
    });

    it("renders delete button for each tag", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Reactを削除" })).toBeInTheDocument()
      );
    });

    it("calls deleteTag with the tag id", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() => screen.getByRole("button", { name: "Reactを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "Reactを削除" }));
      expect(deleteTag).toHaveBeenCalledWith("tag-1");
    });

    it("removes deleted tag from the list", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() => screen.getByRole("button", { name: "Reactを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "Reactを削除" }));
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: "Reactを削除" })).not.toBeInTheDocument()
      );
    });
  });

  describe("image drop zone", () => {
    let uploadImage: jest.Mock;

    beforeEach(() => {
      uploadImage = require("@/lib/api").uploadImage;
      uploadImage.mockClear();
    });

    it("renders drop zone region", async () => {
      render(<EditPostPage params={params} />);
      await waitFor(() =>
        expect(screen.getByRole("region", { name: /ドロップゾーン/i })).toBeInTheDocument()
      );
    });

    it("shows drag-over feedback when file is dragged over", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });

      fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"] } });

      expect(screen.getByText(/ドロップして追加/i)).toBeInTheDocument();
    });

    it("hides drag-over feedback on drag leave", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });

      fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"] } });
      fireEvent.dragLeave(zone);

      expect(screen.queryByText(/ドロップして追加/i)).not.toBeInTheDocument();
    });

    it("calls uploadImage when image file is dropped", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "concept.png", { type: "image/png" });

      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file));
    });

    it("shows preview after dropping image", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "concept.png", { type: "image/png" });

      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() =>
        expect(screen.getByRole("img", { name: /プレビュー/i })).toBeInTheDocument()
      );
    });

    it("calls uploadImage when image is pasted", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "concept.png", { type: "image/png" });

      fireEvent.paste(zone, {
        clipboardData: {
          items: [{ type: "image/png", getAsFile: () => file }],
          files: [file],
        },
      });

      await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file));
    });

    it("shows preview after pasting image", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "concept.png", { type: "image/png" });

      fireEvent.paste(zone, {
        clipboardData: {
          items: [{ type: "image/png", getAsFile: () => file }],
          files: [file],
        },
      });

      await waitFor(() =>
        expect(screen.getByRole("img", { name: /プレビュー/i })).toBeInTheDocument()
      );
    });

    it("ignores drop of non-image files", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["text"], "doc.txt", { type: "text/plain" });

      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(uploadImage).not.toHaveBeenCalled());
    });

    it("ignores paste of non-image content", async () => {
      render(<EditPostPage params={params} />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });

      fireEvent.paste(zone, {
        clipboardData: {
          items: [{ type: "text/plain", getAsFile: () => null }],
          files: [],
        },
      });

      expect(uploadImage).not.toHaveBeenCalled();
    });
  });

  describe("existing image", () => {
    it("shows existing image_key as preview on load", async () => {
      require("@/lib/api").getPost.mockResolvedValueOnce(mockPinnedPost);
      render(<EditPostPage params={params} />);
      const img = await screen.findByRole("img", { name: /プレビュー/i });
      expect(img).toHaveAttribute("src", `/api/images/${mockPinnedPost.image_key}`);
    });

    it("replaces preview when new image is dropped", async () => {
      require("@/lib/api").getPost.mockResolvedValueOnce(mockPinnedPost);
      require("@/lib/api").uploadImage.mockResolvedValueOnce({
        key: "images/new.png",
        url: "/api/images/images/new.png",
      });
      render(<EditPostPage params={params} />);
      await screen.findByRole("img", { name: /プレビュー/i });

      const zone = screen.getByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "new.png", { type: "image/png" });
      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() =>
        expect(require("@/lib/api").uploadImage).toHaveBeenCalledWith(file)
      );
    });
  });

  describe("Canva export integration", () => {
    let useCanvaExport: jest.Mock;

    beforeEach(() => {
      useCanvaExport = require("@/hooks/useCanvaExport").useCanvaExport;
      useCanvaExport.mockClear();
      useCanvaExport.mockImplementation(() => ({ sessionToken: "test-session-edit" }));
    });

    it("概念作成 link includes session token", async () => {
      render(<EditPostPage params={params} />);
      const link = await screen.findByRole("link", { name: /概念作成/i });
      expect(link.getAttribute("href")).toContain("test-session-edit");
    });

    it("auto-sets image preview when Canva export fires", async () => {
      let capturedOnExport: ((key: string) => void) | null = null;
      useCanvaExport.mockImplementation(({ onExport }: { onExport: (key: string) => void }) => {
        capturedOnExport = onExport;
        return { sessionToken: "test-session-edit" };
      });

      render(<EditPostPage params={params} />);
      await screen.findByRole("link", { name: /概念作成/i });

      act(() => { capturedOnExport?.("images/canva/edit-export.png"); });

      await waitFor(() =>
        expect(screen.getByRole("img", { name: /プレビュー/i })).toBeInTheDocument()
      );
    });
  });
});
