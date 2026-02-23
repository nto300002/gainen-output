import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUploader } from "@/components/image-uploader";

// Mock the api module to avoid fetch complexity in component tests
jest.mock("@/lib/api", () => ({
  uploadImage: jest.fn().mockResolvedValue({
    key: "images/uploaded-image.png",
    url: "https://cdn.example.com/images/uploaded-image.png",
  }),
}));

describe("ImageUploader", () => {
  it("shows drop zone text", () => {
    render(<ImageUploader onUpload={jest.fn()} />);
    // The component shows Japanese text for drag/drop/click/upload
    expect(screen.getByText(/ドロップ|クリック|アップロード/)).toBeInTheDocument();
  });

  it("calls onUpload callback after file selection", async () => {
    const onUpload = jest.fn();
    render(<ImageUploader onUpload={onUpload} />);

    const file = new File(["image"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");
    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(onUpload).toHaveBeenCalledWith(
        expect.objectContaining({ key: expect.any(String), url: expect.any(String) })
      )
    );
  });

  it("shows validation error for non-image files", async () => {
    render(<ImageUploader onUpload={jest.fn()} />);

    const file = new File(["text"], "test.txt", { type: "text/plain" });
    const input = screen.getByTestId("file-input");
    // applyAccept: false bypasses the <input accept="image/*"> restriction
    // so the component's own validation runs
    await userEvent.upload(input, file, { applyAccept: false });

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("does not show loading state after upload completes", async () => {
    render(<ImageUploader onUpload={jest.fn()} />);

    const file = new File(["image"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument());
  });
});
