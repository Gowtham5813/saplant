import { describe, expect, it } from "vitest";
import { getMonthlyPlantingCounts, getPlantingStreak } from "@/lib/planting-growth";

describe("getMonthlyPlantingCounts", () => {
  it("returns six calendar months with counts from planting timestamps", () => {
    const result = getMonthlyPlantingCounts(
      [
        { planted_at: "2026-01-04T12:00:00Z" },
        { planted_at: "2026-03-01T09:00:00Z" },
        { planted_at: "2026-03-22T16:30:00Z" },
        { planted_at: "2026-06-10T08:00:00Z" },
        { planted_at: "2025-12-31T23:59:00Z" },
      ],
      new Date("2026-06-15T12:00:00Z"),
    );

    expect(result).toEqual([
      { month: "Jan", count: 1 },
      { month: "Feb", count: 0 },
      { month: "Mar", count: 2 },
      { month: "Apr", count: 0 },
      { month: "May", count: 0 },
      { month: "Jun", count: 1 },
    ]);
  });

  it("keeps the current month and zero-count months in an empty history", () => {
    expect(getMonthlyPlantingCounts([], new Date("2026-06-15T12:00:00Z"))).toEqual([
      { month: "Jan", count: 0 },
      { month: "Feb", count: 0 },
      { month: "Mar", count: 0 },
      { month: "Apr", count: 0 },
      { month: "May", count: 0 },
      { month: "Jun", count: 0 },
    ]);
  });
});

describe("getPlantingStreak", () => {
  it("counts consecutive active weeks through the current week and the longest run", () => {
    const result = getPlantingStreak(
      [
        { planted_at: "2026-01-05T12:00:00Z" },
        { planted_at: "2026-01-12T12:00:00Z" },
        { planted_at: "2026-02-02T12:00:00Z" },
        { planted_at: "2026-06-01T12:00:00Z" },
        { planted_at: "2026-06-14T12:00:00Z" },
        { planted_at: "2026-06-15T12:00:00Z" },
      ],
      new Date("2026-06-17T12:00:00Z"),
    );

    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it("returns zero current streak when this week has no planting, while keeping the personal best", () => {
    const result = getPlantingStreak(
      [
        { planted_at: "2026-06-01T12:00:00Z" },
        { planted_at: "2026-06-08T12:00:00Z" },
      ],
      new Date("2026-06-17T12:00:00Z"),
    );

    expect(result).toEqual({ current: 0, longest: 2 });
  });

  it("returns no streak for an empty planting history", () => {
    expect(getPlantingStreak([], new Date("2026-06-17T12:00:00Z"))).toEqual({ current: 0, longest: 0 });
  });
});