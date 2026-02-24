import { render, screen } from "@testing-library/react";
import AdminLayout from "@/app/admin/(protected)/layout";

describe("AdminLayout", () => {
  it("renders children", async () => {
    const jsx = await AdminLayout({ children: <div>Admin content</div> });
    render(jsx);
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("shows admin navigation or header", async () => {
    const jsx = await AdminLayout({ children: <div>Content</div> });
    render(jsx);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
