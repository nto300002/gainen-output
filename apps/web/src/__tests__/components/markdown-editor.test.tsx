import { render, screen } from "@testing-library/react";
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
});
