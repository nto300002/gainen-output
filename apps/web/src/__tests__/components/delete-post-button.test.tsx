import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeletePostButton } from "@/components/delete-post-button";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  deletePost: jest.fn().mockResolvedValue({ ok: true }),
}));

describe("DeletePostButton", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    jest.clearAllMocks();
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a delete button", () => {
    render(<DeletePostButton postId="post-1" />);
    expect(screen.getByRole("button", { name: /削除/i })).toBeInTheDocument();
  });

  it("calls deletePost with postId when confirmed", async () => {
    const { deletePost } = require("@/lib/api");
    render(<DeletePostButton postId="post-1" />);
    await userEvent.click(screen.getByRole("button", { name: /削除/i }));
    await waitFor(() => expect(deletePost).toHaveBeenCalledWith("post-1"));
  });

  it("calls router.refresh after deletion", async () => {
    render(<DeletePostButton postId="post-1" />);
    await userEvent.click(screen.getByRole("button", { name: /削除/i }));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("does not call deletePost when user cancels confirm", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    const { deletePost } = require("@/lib/api");
    render(<DeletePostButton postId="post-1" />);
    await userEvent.click(screen.getByRole("button", { name: /削除/i }));
    expect(deletePost).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
