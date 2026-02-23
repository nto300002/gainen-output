import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("ThemeToggle", () => {
  it("renders a button with theme toggle aria-label", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: jest.fn(),
      resolvedTheme: "light",
      themes: [],
      systemTheme: undefined,
      forcedTheme: undefined,
    });
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /テーマ切り替え/i })).toBeInTheDocument();
  });

  it("calls setTheme with dark when current theme is light", async () => {
    const setTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme,
      resolvedTheme: "light",
      themes: [],
      systemTheme: undefined,
      forcedTheme: undefined,
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /テーマ切り替え/i }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with light when current theme is dark", async () => {
    const setTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: "dark",
      setTheme,
      resolvedTheme: "dark",
      themes: [],
      systemTheme: undefined,
      forcedTheme: undefined,
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /テーマ切り替え/i }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
