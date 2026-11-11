import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { YearlyGoalCard } from "@/components/YearlyGoalCard";

const update = vi.fn();
const eq = vi.fn(() => Promise.resolve({ error: null }));
const from = vi.fn((_table: string) => ({ update, eq }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => from(table) },
}));

describe("YearlyGoalCard", () => {
  beforeEach(() => {
    update.mockReset();
    update.mockReturnValue({ eq });
    eq.mockReset();
    eq.mockResolvedValue({ error: null });
    from.mockClear();
  });

  it("saves a positive integer goal to the user's profile and shows progress", async () => {
    const onGoalUpdated = vi.fn();
    const { rerender } = render(
      <YearlyGoalCard
        userId="user-123"
        year={2026}
        plantingCount={2}
        goal={null}
        onGoalUpdated={onGoalUpdated}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set your goal" }));
    fireEvent.change(screen.getByLabelText("Sapling target"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Save goal" }));

    await waitFor(() => expect(onGoalUpdated).toHaveBeenCalledWith(8));
    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith({ yearly_sapling_goal: 8 });
    expect(eq).toHaveBeenCalledWith("id", "user-123");
    rerender(
      <YearlyGoalCard
        userId="user-123"
        year={2026}
        plantingCount={2}
        goal={8}
        onGoalUpdated={onGoalUpdated}
      />,
    );
    expect(screen.getByRole("progressbar", { name: "2026 planting goal progress" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("of 8")).toBeInTheDocument();
  });

  it("rejects a decimal target without writing it to the profile", async () => {
    render(
      <YearlyGoalCard
        userId="user-123"
        year={2026}
        plantingCount={0}
        goal={null}
        onGoalUpdated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set your goal" }));
    fireEvent.change(screen.getByLabelText("Sapling target"), { target: { value: "2.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save goal" }));

    expect(await screen.findByText("Enter a whole number greater than zero.")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});