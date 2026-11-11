import { format, startOfMonth, subMonths } from "date-fns";

export interface MonthlyPlantingCount {
  month: string;
  count: number;
}

export function getMonthlyPlantingCounts(
  plantings: readonly { planted_at: string }[],
  now = new Date(),
): MonthlyPlantingCount[] {
  const counts = new Map<string, number>();

  for (const planting of plantings) {
    const date = new Date(planting.planted_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = format(startOfMonth(date), "yyyy-MM");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 6 }, (_, index) => {
    const month = startOfMonth(subMonths(now, 5 - index));
    return {
      month: format(month, "MMM"),
      count: counts.get(format(month, "yyyy-MM")) ?? 0,
    };
  });
}