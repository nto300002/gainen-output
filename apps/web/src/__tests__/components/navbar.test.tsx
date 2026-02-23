import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/navbar";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({
    theme: "light",
    setTheme: jest.fn(),
    resolvedTheme: "light",
  })),
}));

describe("Navbar", () => {
  it("renders the logo link to /", () => {
    render(<Navbar />);
    const logoLink = screen.getByRole("link", { name: /概念理解ノート/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders ホーム navigation link to /", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
  });

  it("renders 管理 navigation link to /admin", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "管理" })).toHaveAttribute("href", "/admin");
  });

  it("renders theme toggle button", () => {
    render(<Navbar />);
    expect(screen.getByRole("button", { name: /テーマ切り替え/i })).toBeInTheDocument();
  });
});
