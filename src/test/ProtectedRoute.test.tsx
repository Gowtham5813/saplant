import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <div>Secret Dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  it("shows loader while auth resolves", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, loading: true });
    const { container } = renderAt("/app");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.queryByText("Secret Dashboard")).toBeNull();
  });

  it("redirects unauthenticated users to /auth", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, loading: false });
    renderAt("/app");
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Dashboard")).toBeNull();
  });

  it("renders children when user is authenticated", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "u1" },
      loading: false,
    });
    renderAt("/app");
    expect(screen.getByText("Secret Dashboard")).toBeInTheDocument();
  });
});
