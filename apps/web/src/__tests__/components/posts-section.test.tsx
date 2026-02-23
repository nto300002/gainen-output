import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostsSection } from "@/components/posts-section";
import { mockPost, mockPinnedPost, mockCategory } from "@/__tests__/mocks/fixtures";
import type { Category, PostWithRelations } from "@/types";

const mockCategoryB: Category = {
  id: "cat-2",
  name: "Python",
  slug: "python",
  color: "#3776AB",
  sort_order: 2,
  created_at: "2024-01-01T00:00:00.000Z",
};

const mockPostB: PostWithRelations = {
  ...mockPost,
  id: "post-b",
  title: "Learn Python Basics",
  slug: "learn-python-basics",
  category_id: "cat-2",
  category_name: "Python",
  category_color: "#3776AB",
};

describe("PostsSection", () => {
  it("renders all posts initially", () => {
    render(<PostsSection posts={[mockPost, mockPinnedPost]} categories={[mockCategory]} />);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("Getting Started with TypeScript")).toBeInTheDocument();
  });

  it("renders category filter", () => {
    render(<PostsSection posts={[mockPost]} categories={[mockCategory]} />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
  });

  it("filters posts when a category is selected", async () => {
    render(
      <PostsSection
        posts={[mockPost, mockPostB]}
        categories={[mockCategory, mockCategoryB]}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Python" }));
    expect(screen.queryByText("Understanding React Hooks")).not.toBeInTheDocument();
    expect(screen.getByText("Learn Python Basics")).toBeInTheDocument();
  });

  it("shows all posts when All is clicked after filtering", async () => {
    render(
      <PostsSection
        posts={[mockPost, mockPostB]}
        categories={[mockCategory, mockCategoryB]}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Python" }));
    await userEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("Learn Python Basics")).toBeInTheDocument();
  });
});
