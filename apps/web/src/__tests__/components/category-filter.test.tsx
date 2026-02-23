import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilter } from "@/components/category-filter";
import { mockCategory } from "@/__tests__/mocks/fixtures";

describe("CategoryFilter", () => {
  it("displays category buttons", () => {
    render(<CategoryFilter categories={[mockCategory]} onFilter={jest.fn()} />);
    expect(screen.getByRole("button", { name: "JavaScript" })).toBeInTheDocument();
  });

  it("shows All button", () => {
    render(<CategoryFilter categories={[mockCategory]} onFilter={jest.fn()} />);
    expect(screen.getByRole("button", { name: /all|すべて/i })).toBeInTheDocument();
  });

  it("calls onFilter with category id when clicked", async () => {
    const onFilter = jest.fn();
    render(<CategoryFilter categories={[mockCategory]} onFilter={onFilter} />);
    await userEvent.click(screen.getByRole("button", { name: "JavaScript" }));
    expect(onFilter).toHaveBeenCalledWith("cat-1");
  });

  it("calls onFilter with null when All is clicked", async () => {
    const onFilter = jest.fn();
    render(<CategoryFilter categories={[mockCategory]} onFilter={onFilter} />);
    await userEvent.click(screen.getByRole("button", { name: /all|すべて/i }));
    expect(onFilter).toHaveBeenCalledWith(null);
  });

  it("toggles active state on category button", async () => {
    render(<CategoryFilter categories={[mockCategory]} onFilter={jest.fn()} />);
    const btn = screen.getByRole("button", { name: "JavaScript" });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});
