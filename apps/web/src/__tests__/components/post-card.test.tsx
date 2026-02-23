import { render, screen } from "@testing-library/react";
import { PostCard } from "@/components/post-card";
import { mockPost, mockPinnedPost } from "@/__tests__/mocks/fixtures";

describe("PostCard", () => {
  it("displays the post title", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
  });

  it("displays the category name", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("displays tags", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("displays the created date", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("shows PIN indicator for pinned posts", () => {
    render(<PostCard post={mockPinnedPost} />);
    expect(screen.getByText(/pin/i)).toBeInTheDocument();
  });

  it("does not show PIN indicator for non-pinned posts", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.queryByText(/pin/i)).not.toBeInTheDocument();
  });

  it("renders a link to /posts/[slug]", () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/posts/${mockPost.slug}`);
  });

  it("renders an image when image_key is set", () => {
    render(<PostCard post={mockPinnedPost} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("does not render an image when image_key is null", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
