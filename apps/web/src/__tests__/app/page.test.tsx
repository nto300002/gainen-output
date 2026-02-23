import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Mock the API module
jest.mock("@/lib/api", () => ({
  getPosts: jest.fn().mockResolvedValue([
    require("@/__tests__/mocks/fixtures").mockPinnedPost,
    require("@/__tests__/mocks/fixtures").mockPost,
  ]),
  getCategories: jest.fn().mockResolvedValue([
    require("@/__tests__/mocks/fixtures").mockCategory,
  ]),
}));

describe("HomePage", () => {
  it("displays the blog title", async () => {
    const jsx = await HomePage();
    render(jsx);
    expect(screen.getByText("概念理解ノート")).toBeInTheDocument();
  });

  it("displays post cards", async () => {
    const jsx = await HomePage();
    render(jsx);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("Getting Started with TypeScript")).toBeInTheDocument();
  });

  it("displays pinned post first", async () => {
    const jsx = await HomePage();
    render(jsx);
    const titles = screen.getAllByRole("heading", { level: 2 });
    expect(titles[0]).toHaveTextContent("Getting Started with TypeScript");
  });
});
