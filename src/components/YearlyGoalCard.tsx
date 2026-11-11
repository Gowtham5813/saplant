import { useState, type FormEvent } from "react";
import { Sprout, Target } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getYearlyGoalProgress } from "@/lib/yearly-goal";
import { toast } from "sonner";

const goalSchema = z.string().trim().regex(/^[1-9]\d*$/, "Enter a whole number greater than zero.")
  .transform(Number)
  .refine(Number.isSafeInteger, "Enter a valid whole number.")
  .refine((value) => value <= 2_147_483_647, "Enter a smaller goal.");

interface YearlyGoalCardProps {
  userId: string;
  year: number;
  plantingCount: number;
  goal: number | null;
  loading?: boolean;
  onGoalUpdated: (goal: number) => void;
}

export const YearlyGoalCard = ({ userId, year, plantingCount, goal, loading = false, onGoalUpdated }: YearlyGoalCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [saving, setSaving] = useState(false);
  const progress = goal ? getYearlyGoalProgress(plantingCount, goal) : null;
  const circumference = 2 * Math.PI * 38;
  const strokeOffset = progress ? circumference * (1 - progress.progressPercent / 100) : circumference;

  const openDialog = () => {
    setGoalInput(goal ? String(goal) : "");
    setDialogOpen(true);
  };

  const saveGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedGoal = goalSchema.safeParse(goalInput);
    if (!parsedGoal.success) {
      toast.error(parsedGoal.error.issues[0]?.message ?? "Enter a valid goal.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ yearly_sapling_goal: parsedGoal.data })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      toast.error("Your goal could not be saved. Please try again.");
      return;
    }

    onGoalUpdated(parsedGoal.data);
    setDialogOpen(false);
    toast.success("Your yearly goal is saved.");
  };

  return (
    <>
      <section className="mb-10 flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8" aria-labelledby="yearly-goal-heading">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-primary-glow">
            <Target className="h-5 w-5" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wider">{year} planting goal</p>
          </div>
          <h2 id="yearly-goal-heading" className="mt-2 font-serif text-2xl sm:text-3xl">My yearly goal</h2>
          {loading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading your progress…</p>
          ) : progress ? (
            <>
              <p className="mt-2 text-muted-foreground">
                {progress.completed
                  ? "You reached your goal. What a wonderful year of growth!"
                  : `${progress.remaining} more sapling${progress.remaining === 1 ? "" : "s"} to reach your goal.`}
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={openDialog}>
                Change goal
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-muted-foreground">Choose a number of saplings to plant this year, and watch your progress grow.</p>
              <Button type="button" variant="forest" className="mt-4" onClick={openDialog}>
                <Sprout className="h-4 w-4" aria-hidden="true" /> Set your goal
              </Button>
            </>
          )}
        </div>

        {progress && (
          <div className="flex shrink-0 items-center gap-4 self-start sm:self-center">
            <div className="relative h-28 w-28" role="progressbar" aria-label={`${year} planting goal progress`} aria-valuemin={0} aria-valuemax={goal ?? 0} aria-valuenow={Math.min(plantingCount, goal ?? 0)}>
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-serif text-2xl leading-none text-primary">{plantingCount}</span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">of {goal}</span>
              </div>
            </div>
            <p className="max-w-24 text-sm text-muted-foreground">saplings planted this year</p>
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Set your {year} goal</DialogTitle>
            <DialogDescription>How many saplings would you like to plant this year?</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveGoal} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="yearly-sapling-goal">Sapling target</Label>
              <Input
                autoFocus
                id="yearly-sapling-goal"
                type="number"
                inputMode="numeric"
                min={1}
                max={2_147_483_647}
                step={1}
                placeholder="e.g. 12"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="forest" disabled={saving || !goalInput.trim()}>
                {saving ? "Saving…" : "Save goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};