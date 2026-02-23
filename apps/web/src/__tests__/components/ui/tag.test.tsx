import { render } from "@testing-library/react";
import { TagBadge } from "@/components/ui/tag";
import { mockTag } from "@/__tests__/mocks/fixtures";

describe("TagBadge", () => {
  it("displays the tag label", () => {
    const { getByText } = render(<TagBadge tag={mockTag} />);
    expect(getByText("React")).toBeInTheDocument();
  });

  it("applies near-black text class in light mode", () => {
    const { container } = render(<TagBadge tag={mockTag} />);
    expect(container.firstChild).toHaveClass("text-zinc-900");
  });
});
