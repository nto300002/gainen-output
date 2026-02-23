import { render, screen } from "@testing-library/react";
import { PostViewer } from "@/components/post-viewer";
import { mockPost, mockPinnedPost } from "@/__tests__/mocks/fixtures";

describe("PostViewer", () => {
  it("displays the post title as h1", () => {
    render(<PostViewer post={mockPost} />);
    expect(screen.getByRole("heading", { level: 1, name: mockPost.title })).toBeInTheDocument();
  });

  it("renders Markdown body as HTML", () => {
    render(<PostViewer post={mockPost} />);
    expect(screen.getByText(/React Hooks allow you/)).toBeInTheDocument();
  });

  it("shows related posts section when relatedPosts are provided", () => {
    render(<PostViewer post={mockPost} relatedPosts={[mockPinnedPost]} />);
    expect(screen.getByText(/関連記事|Related/i)).toBeInTheDocument();
  });

  it("does not show related posts section when empty", () => {
    render(<PostViewer post={mockPost} relatedPosts={[]} />);
    expect(screen.queryByText(/関連記事|Related/i)).not.toBeInTheDocument();
  });
});
