export const BADGES = [
  { threshold: 1, name: "Seedling", icon: "🌱" },
  { threshold: 5, name: "Sprout", icon: "🌿" },
  { threshold: 10, name: "Sapling", icon: "🪴" },
  { threshold: 25, name: "Grove Keeper", icon: "🌳" },
  { threshold: 50, name: "Forest Guardian", icon: "🌲" },
  { threshold: 100, name: "Canopy Champion", icon: "🏆" },
] as const;

export interface BadgeProgress {
  threshold: number;
  name: string;
  icon: string;
  earned: boolean;
  remaining: number;
  isNext: boolean;
  progressPercent: number;
}

export function getBadgeProgress(plantingCount: number): BadgeProgress[] {
  const count = Math.max(0, Math.floor(plantingCount));
  const nextIndex = BADGES.findIndex((badge) => badge.threshold > count);

  return BADGES.map((badge, index) => ({
    ...badge,
    earned: badge.threshold <= count,
    remaining: Math.max(0, badge.threshold - count),
    isNext: index === nextIndex,
    progressPercent: Math.min(100, (count / badge.threshold) * 100),
  }));
}