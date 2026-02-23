import { render } from "@testing-library/react";
import { CategoryBadge } from "@/components/ui/category-badge";
import { mockCategory } from "@/__tests__/mocks/fixtures";

describe("CategoryBadge", () => {
  it("displays the category name", () => {
    const { getByText } = render(<CategoryBadge category={mockCategory} />);
    expect(getByText("JavaScript")).toBeInTheDocument();
  });

  it("applies dynamic color via style prop", () => {
    const { container } = render(<CategoryBadge category={mockCategory} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderColor).toBeTruthy();
  });
});
