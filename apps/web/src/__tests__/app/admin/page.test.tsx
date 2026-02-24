import { render, screen } from "@testing-library/react";
import AdminPage from "@/app/admin/(protected)/page";
import { mockPost, mockDraftPost, mockPinnedPost } from "@/__tests__/mocks/fixtures";

jest.mock("@/lib/api", () => ({
  getPosts: jest.fn().mockResolvedValue([
    require("@/__tests__/mocks/fixtures").mockPinnedPost,
    require("@/__tests__/mocks/fixtures").mockPost,
    require("@/__tests__/mocks/fixtures").mockDraftPost,
  ]),
  deletePost: jest.fn().mockResolvedValue({ ok: true }),
}));

describe("AdminPage", () => {
  it("displays the dashboard heading", async () => {
    const jsx = await AdminPage();
    render(jsx);
    expect(screen.getByRole("heading", { name: /dashboard|ダッシュボード/i })).toBeInTheDocument();
  });

  it("shows published post count", async () => {
    const jsx = await AdminPage();
    render(jsx);
    expect(screen.getByText(/2/)).toBeInTheDocument(); // 2 published posts
  });

  it("shows draft post count", async () => {
    const jsx = await AdminPage();
    render(jsx);
    expect(screen.getByText(/1/)).toBeInTheDocument(); // 1 draft post
  });

  it("has link to create new post", async () => {
    const jsx = await AdminPage();
    render(jsx);
    const link = screen.getByRole("link", { name: /新規投稿|new post/i });
    expect(link).toHaveAttribute("href", "/admin/new");
  });

  it("shows a delete button for each post", async () => {
    const jsx = await AdminPage();
    render(jsx);
    const deleteButtons = screen.getAllByRole("button", { name: /削除/i });
    expect(deleteButtons).toHaveLength(3);
  });
});
