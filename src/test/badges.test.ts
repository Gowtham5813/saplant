import { describe, expect, it } from "vitest";
import { getBadgeProgress } from "@/lib/badges";

describe("getBadgeProgress", () => {
  it("marks earned badges and shows remaining saplings and progress for the next badge", () => {
    const badges = getBadgeProgress(4);

    expect(badges[0]).toMatchObject({ name: "Seedling", earned: true, remaining: 0, isNext: false, progressPercent: 100 });
    expect(badges[1]).toMatchObject({ name: "Sprout", earned: false, remaining: 1, isNext: true, progressPercent: 80 });
    expect(badges[2]).toMatchObject({ name: "Sapling", earned: false, remaining: 6, isNext: false });
  });

  it("keeps all badges locked with the full sapling requirement for an empty planting history", () => {
    const badges = getBadgeProgress(0);

    expect(badges).toHaveLength(6);
    expect(badges[0]).toMatchObject({ earned: false, remaining: 1, isNext: true, progressPercent: 0 });
    expect(badges[5]).toMatchObject({ earned: false, remaining: 100, isNext: false });
  });

  it("marks every badge earned after reaching the highest threshold", () => {
    const badges = getBadgeProgress(100);

    expect(badges.every((badge) => badge.earned)).toBe(true);
    expect(badges.some((badge) => badge.isNext)).toBe(false);
  });
});