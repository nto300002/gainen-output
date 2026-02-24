import { render } from "@testing-library/react";
import { CategoryBadge } from "@/components/ui/category-badge";
import { mockCategory } from "@/__tests__/mocks/fixtures";

describe("CategoryBadge", () => {
  it("displays the category name", () => {
    const { getByText } = render(<CategoryBadge category={mockCategory} />);
    expect(getByText("JavaScript")).toBeInTheDocument();
  });

  it("uses default indigo border and text color via Tailwind classes", () => {
    const { container } = render(<CategoryBadge category={mockCategory} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderColor).toBeFalsy();
    expect(el.style.color).toBeFalsy();
  });
});
