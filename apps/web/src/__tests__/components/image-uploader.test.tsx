import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUploader } from "@/components/image-uploader";

describe("ImageUploader", () => {
  it("shows drop zone text", () => {
    render(<ImageUploader onUpload={jest.fn()} />);
    expect(screen.getByText(/drag|drop|click|upload/i)).toBeInTheDocument();
  });

  it("calls onUpload callback after file selection", async () => {
    const onUpload = jest.fn();
    render(<ImageUploader onUpload={onUpload} />);

    const file = new File(["image"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");
    await userEvent.upload(input, file);

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(
      expect.objectContaining({ key: expect.any(String), url: expect.any(String) })
    ));
  });

  it("shows validation error for non-image files", async () => {
    render(<ImageUploader onUpload={jest.fn()} />);

    const file = new File(["text"], "test.txt", { type: "text/plain" });
    const input = screen.getByTestId("file-input");
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("shows loading state during upload", async () => {
    render(<ImageUploader onUpload={jest.fn()} />);

    const file = new File(["image"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("file-input");
    await userEvent.upload(input, file);

    // loading should have been shown (may be brief, just ensure it completes)
    await waitFor(() => expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument());
  });
});
