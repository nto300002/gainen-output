import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/navbar";

describe("Navbar", () => {
  it("renders the logo link to /", () => {
    render(<Navbar />);
    const logoLink = screen.getByRole("link", { name: /概念理解ノート/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders theme toggle button", () => {
    render(<Navbar />);
    expect(screen.getByRole("button", { name: /テーマ切り替え/i })).toBeInTheDocument();
  });
});
