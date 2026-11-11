import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PlantingDetail from "@/pages/PlantingDetail";

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((_table: string) => ({ select }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => from(table) },
}));
vi.mock("@/components/SiteHeader", () => ({ SiteHeader: () => null }));
vi.mock("@/components/SiteFooter", () => ({ SiteFooter: () => null }));

const planting = {
  id: "planting-1",
  species: "Neem",
  location: "Pune, India",
  notes: "Planted after the first monsoon rain.",
  planted_at: "2026-11-02T10:00:00.000Z",
  user_id: "planter-1",
  latitude: 18.5204,
  longitude: 73.8567,
};

const renderDetail = () => render(
  <MemoryRouter initialEntries={["/app/planting/planting-1"]}>
    <Routes>
      <Route path="/app/planting/:id" element={<PlantingDetail />} />
    </Routes>
  </MemoryRouter>,
);

describe("Planting detail page", () => {
  beforeEach(() => {
    from.mockClear();
    select.mockClear();
    eq.mockClear();
    maybeSingle.mockReset();
  });

  it("shows the planting, planter, date, notes, and map pin when coordinates exist", async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: planting, error: null })
      .mockResolvedValueOnce({ data: { display_name: "Mira" }, error: null });

    renderDetail();

    expect(await screen.findByRole("heading", { name: "Neem" })).toBeInTheDocument();
    expect(screen.getByText("Mira")).toBeInTheDocument();
    expect(screen.getByText("November 2, 2026")).toBeInTheDocument();
    expect(screen.getByText("Pune, India")).toBeInTheDocument();
    expect(screen.getByText("Planted after the first monsoon rain.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View map pin" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=18.5204,73.8567",
    );
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/app/community");
  });

  it("does not show a map pin when coordinates are missing", async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: { ...planting, latitude: null, longitude: null }, error: null })
      .mockResolvedValueOnce({ data: { display_name: "Mira" }, error: null });

    renderDetail();

    expect(await screen.findByRole("heading", { name: "Neem" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View map pin" })).not.toBeInTheDocument();
  });
});