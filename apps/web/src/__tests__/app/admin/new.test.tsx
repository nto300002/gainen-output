import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewPostPage from "@/app/admin/new/page";

jest.mock("@/lib/api", () => ({
  getCategories: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockCategory]),
  getTags: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockTag, require("@/__tests__/mocks/fixtures").mockTag2]),
  createPost: jest.fn().mockResolvedValue({ id: "new-1", slug: "new-post", title: "New Post", status: "draft" }),
}));

describe("NewPostPage", () => {
  it("renders title input", async () => {
    render(<NewPostPage />);
    await waitFor(() => expect(screen.getByLabelText(/title|タイトル/i)).toBeInTheDocument());
  });

  it("renders category selector", async () => {
    render(<NewPostPage />);
    await waitFor(() => expect(screen.getByLabelText(/category|カテゴリ/i)).toBeInTheDocument());
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
});
