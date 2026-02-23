import { render, screen } from "@testing-library/react";
import AdminLayout from "@/app/admin/layout";

describe("AdminLayout", () => {
  it("renders children", () => {
    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>
    );
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("shows admin navigation or header", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
