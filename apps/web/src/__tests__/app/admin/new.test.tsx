import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewPostPage from "@/app/admin/(protected)/new/page";

jest.mock("@/lib/api", () => ({
  getCategories: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockCategory]),
  getTags: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockTag, require("@/__tests__/mocks/fixtures").mockTag2]),
  createPost: jest.fn().mockResolvedValue({ id: "new-1", slug: "new-post", title: "New Post", status: "draft" }),
  createCategory: jest.fn(),
  createTag: jest.fn(),
  uploadImage: jest.fn().mockResolvedValue({ key: "images/test.png", url: "https://cdn.test/test.png" }),
  deleteCategory: jest.fn().mockResolvedValue(undefined),
  deleteTag: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/hooks/useCanvaExport", () => ({
  useCanvaExport: jest.fn(() => ({ sessionToken: "test-session-abc" })),
}));

describe("NewPostPage", () => {
  it("renders title input", async () => {
    render(<NewPostPage />);
    await waitFor(() => expect(screen.getByLabelText(/title|タイトル/i)).toBeInTheDocument());
  });

  it("renders category section", async () => {
    render(<NewPostPage />);
    await waitFor(() => expect(screen.getByText("カテゴリ")).toBeInTheDocument());
  });

  it("renders tag selector", async () => {
    render(<NewPostPage />);
    await waitFor(() => expect(screen.getByText(/tag|タグ/i)).toBeInTheDocument());
  });

  it("shows validation error when submitting empty title", async () => {
    render(<NewPostPage />);
    await waitFor(() => screen.getByRole("button", { name: /draft|下書き/i }));

    await userEvent.click(screen.getByRole("button", { name: /draft|下書き/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("calls createPost with draft status", async () => {
    const { createPost } = require("@/lib/api");
    render(<NewPostPage />);

    await waitFor(() => screen.getByLabelText(/title|タイトル/i));
    await userEvent.type(screen.getByLabelText(/title|タイトル/i), "My New Post");
    await userEvent.click(screen.getByRole("button", { name: /draft|下書き/i }));

    await waitFor(() =>
      expect(createPost).toHaveBeenCalledWith(
        expect.objectContaining({ status: "draft", title: "My New Post" })
      )
    );
  });

  it("calls createPost with published status", async () => {
    const { createPost } = require("@/lib/api");
    render(<NewPostPage />);

    await waitFor(() => screen.getByLabelText(/title|タイトル/i));
    await userEvent.type(screen.getByLabelText(/title|タイトル/i), "My New Post");
    await userEvent.click(screen.getByRole("button", { name: /publish|公開/i }));

    await waitFor(() =>
      expect(createPost).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published", title: "My New Post" })
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
      render(<NewPostPage />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "JavaScriptを削除" })).toBeInTheDocument()
      );
    });

    it("calls deleteCategory with the category id", async () => {
      render(<NewPostPage />);
      await waitFor(() => screen.getByRole("button", { name: "JavaScriptを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "JavaScriptを削除" }));
      expect(deleteCategory).toHaveBeenCalledWith("cat-1");
    });

    it("removes deleted category from the list", async () => {
      render(<NewPostPage />);
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
      render(<NewPostPage />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Reactを削除" })).toBeInTheDocument()
      );
    });

    it("calls deleteTag with the tag id", async () => {
      render(<NewPostPage />);
      await waitFor(() => screen.getByRole("button", { name: "Reactを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "Reactを削除" }));
      expect(deleteTag).toHaveBeenCalledWith("tag-1");
    });

    it("removes deleted tag from the list", async () => {
      render(<NewPostPage />);
      await waitFor(() => screen.getByRole("button", { name: "Reactを削除" }));
      await userEvent.click(screen.getByRole("button", { name: "Reactを削除" }));
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: "Reactを削除" })).not.toBeInTheDocument()
      );
    });

    it("deselects tag if deleted tag was selected", async () => {
      const { createPost } = require("@/lib/api");
      render(<NewPostPage />);
      await waitFor(() => screen.getByRole("button", { name: "React" }));

      // タグを選択してから削除
      await userEvent.click(screen.getByRole("button", { name: "React" }));
      await userEvent.click(screen.getByRole("button", { name: "Reactを削除" }));

      // タイトルを入力して送信
      await userEvent.type(screen.getByLabelText(/title|タイトル/i), "Post");
      await userEvent.click(screen.getByRole("button", { name: /draft|下書き/i }));

      await waitFor(() =>
        expect(createPost).toHaveBeenCalledWith(
          expect.objectContaining({ tag_ids: expect.not.arrayContaining(["tag-1"]) })
        )
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
      render(<NewPostPage />);
      await waitFor(() =>
        expect(screen.getByRole("region", { name: /ドロップゾーン/i })).toBeInTheDocument()
      );
    });

    it("shows drag-over feedback when file is dragged over", async () => {
      render(<NewPostPage />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });

      fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"] } });

      expect(screen.getByText(/ドロップして追加/i)).toBeInTheDocument();
    });

    it("hides drag-over feedback on drag leave", async () => {
      render(<NewPostPage />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });

      fireEvent.dragOver(zone, { dataTransfer: { types: ["Files"] } });
      fireEvent.dragLeave(zone);

      expect(screen.queryByText(/ドロップして追加/i)).not.toBeInTheDocument();
    });

    it("calls uploadImage when image file is dropped", async () => {
      render(<NewPostPage />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "concept.png", { type: "image/png" });

      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file));
    });

    it("shows preview after dropping image", async () => {
      render(<NewPostPage />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["img"], "concept.png", { type: "image/png" });

      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() =>
        expect(screen.getByRole("img", { name: /プレビュー/i })).toBeInTheDocument()
      );
    });

    it("calls uploadImage when image is pasted", async () => {
      render(<NewPostPage />);
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
      render(<NewPostPage />);
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
      render(<NewPostPage />);
      const zone = await screen.findByRole("region", { name: /ドロップゾーン/i });
      const file = new File(["text"], "doc.txt", { type: "text/plain" });

      fireEvent.drop(zone, { dataTransfer: { files: [file], types: ["Files"] } });

      await waitFor(() => expect(uploadImage).not.toHaveBeenCalled());
    });

    it("ignores paste of non-image content", async () => {
      render(<NewPostPage />);
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

  describe("Canva export integration", () => {
    let useCanvaExport: jest.Mock;

    beforeEach(() => {
      useCanvaExport = require("@/hooks/useCanvaExport").useCanvaExport;
      useCanvaExport.mockClear();
      useCanvaExport.mockImplementation(() => ({ sessionToken: "test-session-abc" }));
    });

    it("概念作成 link includes session token", async () => {
      render(<NewPostPage />);
      const link = await screen.findByRole("link", { name: /概念作成/i });
      expect(link.getAttribute("href")).toContain("test-session-abc");
    });

    it("auto-sets image preview when Canva export fires", async () => {
      let capturedOnExport: ((key: string) => void) | null = null;
      useCanvaExport.mockImplementation(({ onExport }: { onExport: (key: string) => void }) => {
        capturedOnExport = onExport;
        return { sessionToken: "test-session-abc" };
      });

      render(<NewPostPage />);
      await screen.findByRole("link", { name: /概念作成/i });

      act(() => { capturedOnExport?.("images/canva/export.png"); });

      await waitFor(() =>
        expect(screen.getByRole("img", { name: /プレビュー/i })).toBeInTheDocument()
      );
    });
  });
});
