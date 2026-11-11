import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import News from "@/pages/News";

const invoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" }, signOut: vi.fn() }),
}));

const articles = [
  {
    title: "Forest restoration reaches new milestone",
    url: "https://news.mongabay.com/story/forest-restoration",
    publishedAt: "2026-11-11T10:00:00Z",
    summary: "Local communities restore native forests and support biodiversity.",
    author: "A. Reporter",
    topics: ["restoration", "forests"],
    source: "Mongabay",
  },
  {
    title: "Wildlife returns to protected habitat",
    url: "https://www.forestsnews.org/story/wildlife",
    publishedAt: "2026-11-10T10:00:00Z",
    summary: "A wildlife survey records recovering animal populations.",
    author: "B. Reporter",
    topics: ["wildlife"],
    source: "Forests News",
  },
];

const renderNews = () => render(<MemoryRouter><News /></MemoryRouter>);

describe("Tree news page", () => {
  beforeEach(() => {
    invoke.mockReset();
    invoke.mockResolvedValue({ data: { articles, updatedAt: "2026-11-11T12:00:00Z" }, error: null });
  });

  it("loads current stories and filters them by topic", async () => {
    renderNews();
    expect(await screen.findByText("Forest restoration reaches new milestone")).toBeInTheDocument();
    expect(screen.getByText("Wildlife returns to protected habitat")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Wildlife" }));
    expect(screen.getByText("Wildlife returns to protected habitat")).toBeInTheDocument();
    expect(screen.queryByText("Forest restoration reaches new milestone")).toBeNull();
  });

  it("searches article titles and summaries", async () => {
    renderNews();
    await screen.findByText("Forest restoration reaches new milestone");
    fireEvent.change(screen.getByRole("textbox", { name: "Search stories" }), { target: { value: "habitat" } });

    await waitFor(() => {
      expect(screen.getByText("Wildlife returns to protected habitat")).toBeInTheDocument();
      expect(screen.queryByText("Forest restoration reaches new milestone")).toBeNull();
    });
  });
});