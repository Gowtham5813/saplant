import { useEffect, useState } from "react";
import { Flame, Target, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WEEKLY_GOAL = 3;

// ISO week key: "2026-W27"
const isoWeekKey = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

const daysUntilNextMonday = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = (8 - (day === 0 ? 7 : day)) % 7 || 7;
  return diff;
};

export const WeeklyChallenge = () => {
  const { user } = useAuth();
  const [thisWeekCount, setThisWeekCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("plantings")
        .select("planted_at")
        .eq("user_id", user.id)
        .order("planted_at", { ascending: false });
      if (!active || !data) return;

      const currentKey = isoWeekKey(new Date());
      const weekSet = new Set(data.map((r) => isoWeekKey(new Date(r.planted_at))));
      setThisWeekCount(data.filter((r) => isoWeekKey(new Date(r.planted_at)) === currentKey).length);

      // Streak: consecutive ISO weeks ending at current (or previous if none yet)
      let cursor = new Date();
      if (!weekSet.has(currentKey)) cursor.setDate(cursor.getDate() - 7);
      let count = 0;
      while (weekSet.has(isoWeekKey(cursor))) {
        count++;
        cursor.setDate(cursor.getDate() - 7);
      }
      setStreak(count);
    };
    load();

    const channel = supabase
      .channel("weekly-challenge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plantings", filter: `user_id=eq.${user.id}` },
        load,
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const progress = Math.min(100, (thisWeekCount / WEEKLY_GOAL) * 100);
  const completed = thisWeekCount >= WEEKLY_GOAL;
  const remaining = Math.max(0, WEEKLY_GOAL - thisWeekCount);
  const daysLeft = daysUntilNextMonday();

  return (
    <div className="rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-soft">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
          <Target className="h-4 w-4" /> This week's challenge
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          <Flame className="h-4 w-4" /> {streak} week{streak === 1 ? "" : "s"} streak
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-serif text-4xl sm:text-5xl">{thisWeekCount}<span className="text-muted-foreground text-2xl sm:text-3xl">/{WEEKLY_GOAL}</span></div>
        <div className="text-sm text-muted-foreground">saplings this week</div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-moss transition-organic" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap text-sm">
        {completed ? (
          <span className="flex items-center gap-1.5 text-primary-glow font-semibold">
            <Sparkles className="h-4 w-4" /> Goal reached! +20 bonus points next week
          </span>
        ) : (
          <span className="text-muted-foreground">
            {remaining} more to go · resets in {daysLeft} day{daysLeft === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
};
