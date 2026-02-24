import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagFilter } from "@/components/tag-filter";
import { mockTag, mockTag2 } from "@/__tests__/mocks/fixtures";

describe("TagFilter", () => {
  it("displays tag buttons", () => {
    render(<TagFilter tags={[mockTag, mockTag2]} onFilter={jest.fn()} />);
    expect(screen.getByRole("button", { name: "React" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TypeScript" })).toBeInTheDocument();
  });

  it("shows All button", () => {
    render(<TagFilter tags={[mockTag]} onFilter={jest.fn()} />);
    expect(screen.getByRole("button", { name: /all|すべて/i })).toBeInTheDocument();
  });

  it("calls onFilter with tag id when clicked", async () => {
    const onFilter = jest.fn();
    render(<TagFilter tags={[mockTag]} onFilter={onFilter} />);
    await userEvent.click(screen.getByRole("button", { name: "React" }));
    expect(onFilter).toHaveBeenCalledWith("tag-1");
  });

  it("calls onFilter with null when All is clicked", async () => {
    const onFilter = jest.fn();
    render(<TagFilter tags={[mockTag]} onFilter={onFilter} />);
    await userEvent.click(screen.getByRole("button", { name: /all|すべて/i }));
    expect(onFilter).toHaveBeenCalledWith(null);
  });

  it("toggles active state on tag button", async () => {
    render(<TagFilter tags={[mockTag]} onFilter={jest.fn()} />);
    const btn = screen.getByRole("button", { name: "React" });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders nothing when no tags", () => {
    const { container } = render(<TagFilter tags={[]} onFilter={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
