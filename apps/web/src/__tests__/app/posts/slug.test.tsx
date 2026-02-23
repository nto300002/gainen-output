import { render, screen } from "@testing-library/react";
import PostPage, { generateMetadata } from "@/app/posts/[slug]/page";
import { mockPost } from "@/__tests__/mocks/fixtures";

jest.mock("@/lib/api", () => ({
  getPost: jest.fn().mockResolvedValue(require("@/__tests__/mocks/fixtures").mockPost),
  getPosts: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockPost]),
}));

const params = Promise.resolve({ slug: "understanding-react-hooks" });

describe("PostPage", () => {
  it("displays post title as h1", async () => {
    const jsx = await PostPage({ params });
    render(jsx);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(mockPost.title);
  });

  it("renders Markdown body", async () => {
    const jsx = await PostPage({ params });
    render(jsx);
    expect(screen.getByText(/React Hooks allow you/)).toBeInTheDocument();
  });
});

describe("generateMetadata", () => {
  it("returns post title as metadata title", async () => {
    const meta = await generateMetadata({ params });
    expect(meta.title).toBe(mockPost.title);
  });
});
