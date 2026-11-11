import { describe, expect, it } from "vitest";
import { getCalendarYearRange, getYearlyGoalProgress } from "@/lib/yearly-goal";

describe("getCalendarYearRange", () => {
  it("returns the exact current calendar year boundaries", () => {
    expect(getCalendarYearRange(new Date("2026-06-15T12:00:00Z"))).toEqual({
      start: "2026-01-01T00:00:00.000Z",
      end: "2027-01-01T00:00:00.000Z",
    });
  });
});

describe("getYearlyGoalProgress", () => {
  it("reports progress and saplings remaining toward the yearly target", () => {
    expect(getYearlyGoalProgress(3, 10)).toEqual({ progressPercent: 30, remaining: 7, completed: false });
  });

  it("caps the ring at full when the planting count reaches or exceeds the target", () => {
    expect(getYearlyGoalProgress(12, 10)).toEqual({ progressPercent: 100, remaining: 0, completed: true });
  });
});