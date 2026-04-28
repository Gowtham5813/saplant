import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
import { useAuth } from "@/contexts/AuthContext";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SiteHeader />
    </MemoryRouter>,
  );

describe("SiteHeader", () => {
  it("shows marketing nav when signed out on landing", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, signOut: vi.fn() });
    renderAt("/");
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Get started")).toBeInTheDocument();
    expect(screen.queryByText("Posts")).toBeNull();
  });

  it("shows app nav (incl. Posts link) when signed in inside /app", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "u1" },
      signOut: vi.fn(),
    });
    renderAt("/app/posts");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Log a planting")).toBeInTheDocument();
    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
  });

  it("shows Saplant brand", () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null, signOut: vi.fn() });
    renderAt("/");
    // brand is split across spans: "Sap" + "lant"
    expect(screen.getByText("Sap")).toBeInTheDocument();
    expect(screen.getByText("lant")).toBeInTheDocument();
  });
});
