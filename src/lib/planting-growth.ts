import { addWeeks, format, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";

export interface MonthlyPlantingCount {
  month: string;
  count: number;
}

export interface PlantingStreak {
  current: number;
  longest: number;
}

export function getPlantingStreak(
  plantings: readonly { planted_at: string }[],
  now = new Date(),
): PlantingStreak {
  const activeWeeks = new Set<number>();

  for (const planting of plantings) {
    const date = new Date(planting.planted_at);
    if (Number.isNaN(date.getTime())) continue;
    activeWeeks.add(startOfWeek(date, { weekStartsOn: 1 }).getTime());
  }

  let current = 0;
  let week = startOfWeek(now, { weekStartsOn: 1 });
  while (activeWeeks.has(week.getTime())) {
    current += 1;
    week = subWeeks(week, 1);
  }

  const sortedWeeks = [...activeWeeks].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let previous: number | null = null;

  for (const timestamp of sortedWeeks) {
    const previousDate = previous === null ? null : new Date(previous);
    if (previousDate && addWeeks(previousDate, 1).getTime() === timestamp) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = timestamp;
  }

  return { current, longest };
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