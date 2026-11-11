import { describe, expect, it } from "vitest";
import { getYearlyGoalProgress } from "@/lib/yearly-goal";

describe("getYearlyGoalProgress", () => {
  it("reports progress and saplings remaining toward the yearly target", () => {
    expect(getYearlyGoalProgress(3, 10)).toEqual({ progressPercent: 30, remaining: 7, completed: false });
  });

  it("caps the ring at full when the planting count reaches or exceeds the target", () => {
    expect(getYearlyGoalProgress(12, 10)).toEqual({ progressPercent: 100, remaining: 0, completed: true });
  });
});