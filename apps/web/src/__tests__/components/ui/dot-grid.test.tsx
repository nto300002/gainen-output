import { render, screen } from "@testing-library/react";
import { DotGrid } from "@/components/ui/dot-grid";

describe("DotGrid", () => {
  it("renders the dot grid element", () => {
    const { container } = render(<DotGrid />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("has aria-hidden attribute", () => {
    const { container } = render(<DotGrid />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("has pointer-events-none class", () => {
    const { container } = render(<DotGrid />);
    expect(container.firstChild).toHaveClass("pointer-events-none");
  });
});
