import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostsSection } from "@/components/posts-section";
import { mockPost, mockPinnedPost, mockTag, mockTag2, mockCategory } from "@/__tests__/mocks/fixtures";
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
  tags: [mockTag2],
};

describe("PostsSection", () => {
  it("renders all posts initially", () => {
    render(<PostsSection posts={[mockPost, mockPinnedPost]} categories={[mockCategory]} />);
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("Getting Started with TypeScript")).toBeInTheDocument();
  });

  it("renders category filter", () => {
    render(<PostsSection posts={[mockPost]} categories={[mockCategory]} />);
    expect(screen.getByRole("group", { name: "カテゴリフィルター" })).toBeInTheDocument();
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
    const categoryFilterGroup = screen.getByRole("group", { name: "カテゴリフィルター" });
    await userEvent.click(screen.getByRole("button", { name: "Python" }));
    await userEvent.click(within(categoryFilterGroup).getByRole("button", { name: /all/i }));
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("Learn Python Basics")).toBeInTheDocument();
  });

  // Tag filtering tests
  it("renders tag filter when posts have tags", () => {
    render(<PostsSection posts={[mockPost]} categories={[mockCategory]} />);
    // mockPost has tag "React"
    expect(screen.getByRole("group", { name: "タグフィルター" })).toBeInTheDocument();
  });

  it("does not render tag filter when no posts have tags", () => {
    const postWithNoTags: PostWithRelations = { ...mockPost, tags: [] };
    render(<PostsSection posts={[postWithNoTags]} categories={[mockCategory]} />);
    expect(screen.queryByRole("group", { name: "タグフィルター" })).not.toBeInTheDocument();
  });

  it("filters posts by tag", async () => {
    // mockPost has tags: [mockTag] (React)
    // mockPinnedPost has tags: [mockTag, mockTag2] (React + TypeScript)
    // mockPostB has tags: [mockTag2] (TypeScript only)
    render(
      <PostsSection
        posts={[mockPost, mockPinnedPost, mockPostB]}
        categories={[mockCategory, mockCategoryB]}
      />
    );
    const tagFilterGroup = screen.getByRole("group", { name: "タグフィルター" });
    // Click TypeScript tag filter button (scoped to avoid PostCard badge)
    await userEvent.click(within(tagFilterGroup).getByRole("button", { name: "TypeScript" }));
    // Only posts with TypeScript tag should show
    expect(screen.queryByText("Understanding React Hooks")).not.toBeInTheDocument();
    expect(screen.getByText("Getting Started with TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Learn Python Basics")).toBeInTheDocument();
  });

  it("shows all posts when tag All is clicked after tag filtering", async () => {
    render(
      <PostsSection
        posts={[mockPost, mockPostB]}
        categories={[mockCategory, mockCategoryB]}
      />
    );
    const tagFilterGroup = screen.getByRole("group", { name: "タグフィルター" });
    // Click TypeScript tag to filter
    await userEvent.click(within(tagFilterGroup).getByRole("button", { name: "TypeScript" }));
    expect(screen.queryByText("Understanding React Hooks")).not.toBeInTheDocument();
    // Click All in tag filter group
    await userEvent.click(within(tagFilterGroup).getByRole("button", { name: /^all$/i }));
    expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
    expect(screen.getByText("Learn Python Basics")).toBeInTheDocument();
  });
});
