export interface YearlyGoalProgress {
  progressPercent: number;
  remaining: number;
  completed: boolean;
}

export function getYearlyGoalProgress(count: number, goal: number): YearlyGoalProgress {
  const safeCount = Math.max(0, Math.floor(count));
  const safeGoal = Math.max(1, Math.floor(goal));

  return {
    progressPercent: Math.min(100, (safeCount / safeGoal) * 100),
    remaining: Math.max(0, safeGoal - safeCount),
    completed: safeCount >= safeGoal,
  };
}