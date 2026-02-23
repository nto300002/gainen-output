import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditPostPage from "@/app/admin/edit/[id]/page";
import { mockPost } from "@/__tests__/mocks/fixtures";

jest.mock("@/lib/api", () => ({
  getPost: jest.fn().mockResolvedValue(require("@/__tests__/mocks/fixtures").mockPost),
  getCategories: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockCategory]),
  getTags: jest.fn().mockResolvedValue([require("@/__tests__/mocks/fixtures").mockTag]),
  updatePost: jest.fn().mockResolvedValue({ ...require("@/__tests__/mocks/fixtures").mockPost, title: "Updated" }),
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
});
