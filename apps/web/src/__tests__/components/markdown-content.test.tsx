import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "@/components/markdown-content";

describe("MarkdownContent", () => {
  it("renders plain text content", () => {
    render(<MarkdownContent>Hello world</MarkdownContent>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders fenced code block with language", () => {
    render(
      <MarkdownContent>{"```tsx\nconst x: number = 1;\n```"}</MarkdownContent>
    );
    // react-markdown mock renders children as text; just verify no crash
    expect(screen.getByTestId("markdown-body")).toBeInTheDocument();
  });

  it("renders fenced code block without language", () => {
    render(<MarkdownContent>{"```\nplain code\n```"}</MarkdownContent>);
    expect(screen.getByTestId("markdown-body")).toBeInTheDocument();
  });
});
