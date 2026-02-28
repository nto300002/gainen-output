import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "@/components/markdown-editor";

describe("MarkdownEditor", () => {
  it("renders a textarea", () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls onChange when user types", async () => {
    const onChange = jest.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "Hello");
    expect(onChange).toHaveBeenCalled();
  });

  it("renders Bold button", () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("renders H1 button", () => {
    render(<MarkdownEditor value="" onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "H1 Heading" })).toBeInTheDocument();
  });

  it("clicking Bold button inserts bold markdown", async () => {
    const onChange = jest.fn();
    render(<MarkdownEditor value="Hello" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("**"));
  });

  it("clicking H1 button inserts heading markdown", async () => {
    const onChange = jest.fn();
    render(<MarkdownEditor value="Hello" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "H1 Heading" }));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("# "));
  });

  describe("image upload", () => {
    it("renders Image button when onImageUpload is provided", () => {
      render(<MarkdownEditor value="" onChange={jest.fn()} onImageUpload={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Image" })).toBeInTheDocument();
    });

    it("does not render Image button when onImageUpload is not provided", () => {
      render(<MarkdownEditor value="" onChange={jest.fn()} />);
      expect(screen.queryByRole("button", { name: "Image" })).not.toBeInTheDocument();
    });

    it("inserts markdown image tag after successful upload", async () => {
      const onImageUpload = jest.fn().mockResolvedValue("/api/images/test.png");
      const onChange = jest.fn();
      render(<MarkdownEditor value="" onChange={onChange} onImageUpload={onImageUpload} />);

      const file = new File(["img"], "test.png", { type: "image/png" });
      const input = document.querySelector(
        'input[type="file"][accept="image/*"]'
      ) as HTMLInputElement;
      await userEvent.upload(input, file, { applyAccept: false });

      await waitFor(() => {
        expect(onImageUpload).toHaveBeenCalledWith(file);
        expect(onChange).toHaveBeenCalledWith(
          expect.stringContaining("![image](/api/images/test.png)")
        );
      });
    });

    it("disables Image button while uploading", async () => {
      let resolveUpload!: (url: string) => void;
      const onImageUpload = jest.fn().mockReturnValue(
        new Promise<string>((r) => { resolveUpload = r; })
      );
      render(<MarkdownEditor value="" onChange={jest.fn()} onImageUpload={onImageUpload} />);

      const file = new File(["img"], "test.png", { type: "image/png" });
      const input = document.querySelector(
        'input[type="file"][accept="image/*"]'
      ) as HTMLInputElement;
      await userEvent.upload(input, file, { applyAccept: false });

      expect(screen.getByRole("button", { name: "Image" })).toBeDisabled();

      resolveUpload("/api/images/test.png");
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Image" })).not.toBeDisabled()
      );
    });
  });
});
