import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, Trophy, TrendingUp, MapPin, Plus, Award, Camera, Heart, MessageCircle, Flame, Check, Lock } from "lucide-react";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WeeklyChallenge } from "@/components/WeeklyChallenge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { getMonthlyPlantingCounts, getPlantingStreak } from "@/lib/planting-growth";
import { getBadgeProgress } from "@/lib/badges";

interface Profile {
  display_name: string;
  total_points: number;
  total_saplings: number;
}
interface Planting {
  id: string;
  species: string;
  location: string;
  planted_at: string;
  points_earned: number;
}
interface GrowthPlanting {
  planted_at: string;
}

const growthChartConfig = {
  count: { label: "Saplings", color: "hsl(var(--primary-glow))" },
} satisfies ChartConfig;

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [growthPlantings, setGrowthPlantings] = useState<GrowthPlanting[]>([]);
  const [allPlantings, setAllPlantings] = useState<GrowthPlanting[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [commentsReceived, setCommentsReceived] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const growthStart = startOfMonth(subMonths(now, 5)).toISOString();
    const growthEnd = startOfMonth(addMonths(now, 1)).toISOString();
    const [{ data: p }, { data: pl }, { data: myPosts }, { data: monthlyPlantings }, { data: allPlantings }] = await Promise.all([
      supabase.from("profiles").select("display_name, total_points, total_saplings").eq("id", user.id).maybeSingle(),
      supabase.from("plantings").select("id, species, location, planted_at, points_earned").eq("user_id", user.id).order("planted_at", { ascending: false }).limit(8),
      supabase.from("posts").select("id").eq("user_id", user.id),
      supabase.from("plantings").select("planted_at").eq("user_id", user.id).gte("planted_at", growthStart).lt("planted_at", growthEnd),
      supabase.from("plantings").select("planted_at").eq("user_id", user.id),
    ]);
    setProfile(p);
    setPlantings(pl ?? []);
    setGrowthPlantings(monthlyPlantings ?? []);
    setAllPlantings(allPlantings ?? []);
    const ids = (myPosts ?? []).map((x) => x.id);
    setPostsCount(ids.length);
    if (ids.length) {
      const [{ count: lc }, { count: cc }] = await Promise.all([
        supabase.from("post_likes").select("id", { count: "exact", head: true }).in("post_id", ids),
        supabase.from("post_comments").select("id", { count: "exact", head: true }).in("post_id", ids),
      ]);
      setLikesReceived(lc ?? 0);
      setCommentsReceived(cc ?? 0);
    } else {
      setLikesReceived(0);
      setCommentsReceived(0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "plantings", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const totalSaplings = profile?.total_saplings ?? 0;
  const badges = getBadgeProgress(allPlantings.length);
  const nextBadge = badges.find((badge) => badge.isNext);
  const earnedBadges = badges.filter((badge) => badge.earned);
  const co2Offset = (totalSaplings * 21).toFixed(0); // ~21kg CO2/year per young tree
  const monthlyGrowth = getMonthlyPlantingCounts(growthPlantings);
  const plantingStreak = getPlantingStreak(allPlantings);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 sm:py-10 md:py-14">
        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 animate-fade-up">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">Your canopy</p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl break-words">
              Hello, <span className="text-shimmer">{profile?.display_name ?? "Planter"}</span>.
            </h1>
            <p className="mt-2 text-muted-foreground">Here's how your forest is growing.</p>
          </div>
          <Button asChild variant="forest" size="lg" className="w-full md:w-auto">
            <Link to="/app/log"><Plus className="h-4 w-4" /> Log a planting</Link>
          </Button>
        </div>

        {/* Stat bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 sm:gap-5 auto-rows-[minmax(160px,auto)] mb-10">
          <div className="md:col-span-3 rounded-3xl bg-animated-forest p-6 sm:p-7 text-primary-foreground shadow-elevated grain relative overflow-hidden hover-lift">
            <div className="relative">
              <Sprout className="h-7 w-7 text-secondary animate-leaf-sway" />
              <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl">{totalSaplings}</div>
              <div className="text-xs sm:text-sm uppercase tracking-wider text-primary-foreground/70 mt-1">Saplings planted</div>
            </div>
          </div>

          <div className="md:col-span-3 rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-soft hover-lift">
            <Trophy className="h-7 w-7 text-primary-glow" />
            <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl">{profile?.total_points ?? 0}</div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mt-1">Green points</div>
          </div>

          <div className="md:col-span-3 rounded-3xl bg-secondary/70 p-6 sm:p-7 shadow-soft hover-lift">
            <Flame className="h-7 w-7 text-primary-glow" aria-hidden="true" />
            <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl">{plantingStreak.current}</div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mt-1">{plantingStreak.current === 1 ? "Week streak" : "Weeks in a row"}</div>
            {plantingStreak.current === 0 && (
              <p className="mt-3 text-sm text-secondary-foreground">
                {plantingStreak.longest === 0 ? (
                  <>Ready to begin? <Link to="/app/log" className="font-semibold underline underline-offset-4">Log a planting</Link> this week.</>
                ) : (
                  <>Start a new streak this week: <Link to="/app/log" className="font-semibold underline underline-offset-4">log a planting</Link>.</>
                )}
              </p>
            )}
            <div className="mt-3 text-sm text-secondary-foreground/80">Longest streak: <span className="font-semibold">{plantingStreak.longest} {plantingStreak.longest === 1 ? "week" : "weeks"}</span></div>
          </div>

          <div className="md:col-span-3 rounded-3xl bg-secondary p-6 sm:p-7 shadow-soft hover-lift">
            <TrendingUp className="h-7 w-7 text-secondary-foreground" />
            <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl text-secondary-foreground break-words">{co2Offset}<span className="text-xl sm:text-2xl"> kg</span></div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-secondary-foreground/70 mt-1">CO₂ offset / yr</div>
          </div>

          {/* Next badge */}
          <div className="md:col-span-6 rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-soft">
            <div className="flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
              <Award className="h-4 w-4" /> Next badge
            </div>
            {nextBadge ? (
              <>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-4xl sm:text-5xl">{nextBadge.icon}</div>
                  <div className="min-w-0">
                    <div className="font-serif text-xl sm:text-2xl truncate">{nextBadge.name}</div>
                    <div className="text-sm text-muted-foreground">{nextBadge.threshold - totalSaplings} more sapling{nextBadge.threshold - totalSaplings === 1 ? "" : "s"} to unlock</div>
                  </div>
                </div>
                <div className="mt-5 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-moss transition-organic" style={{ width: `${Math.min(100, (totalSaplings / nextBadge.threshold) * 100)}%` }} />
                </div>
              </>
            ) : (
              <div className="mt-4 font-serif text-xl sm:text-2xl">All badges unlocked! 🌳</div>
            )}
          </div>

          {/* Earned badges */}
          <div className="md:col-span-6 rounded-3xl bg-surface-cream/70 border border-border p-6 sm:p-7">
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Earned badges</div>
            {earnedBadges.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                {earnedBadges.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 rounded-full bg-card border border-border px-3 sm:px-4 py-2 shadow-soft">
                    <span className="text-lg sm:text-xl">{b.icon}</span>
                    <span className="font-medium text-xs sm:text-sm">{b.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground italic">Plant your first sapling to earn the Seedling badge.</p>
            )}
          </div>
        </div>

        {/* All badges */}
        <section className="mb-10" aria-labelledby="all-badges-heading">
          <div className="mb-5">
            <h2 id="all-badges-heading" className="font-serif text-2xl sm:text-3xl">All badges</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every milestone in your planting journey.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {badges.map((badge) => (
              <article
                key={badge.name}
                className={`flex min-h-40 flex-col rounded-2xl border p-4 shadow-soft transition-organic ${
                  badge.earned
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/60 text-muted-foreground"
                }`}
                aria-label={`${badge.name}: ${badge.earned ? "earned" : `${badge.remaining} more saplings to unlock`}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-3xl ${badge.earned ? "" : "grayscale opacity-60"}`} aria-hidden="true">{badge.icon}</span>
                  {badge.earned ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15" aria-label="Earned">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <Lock className="h-4 w-4 shrink-0" aria-label="Locked" />
                  )}
                </div>
                <h3 className="mt-3 font-serif text-base leading-tight">{badge.name}</h3>
                <p className={`mt-1 text-xs ${badge.earned ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                  {badge.earned ? "Badge earned" : `${badge.remaining} more sapling${badge.remaining === 1 ? "" : "s"} to unlock`}
                </p>
                {badge.isNext && (
                  <div className="mt-auto pt-3">
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-background/70"
                      role="progressbar"
                      aria-label={`Progress toward ${badge.name}`}
                      aria-valuemin={0}
                      aria-valuemax={badge.threshold}
                      aria-valuenow={badge.threshold - badge.remaining}
                    >
                      <div className="h-full rounded-full bg-gradient-moss transition-organic" style={{ width: `${badge.progressPercent}%` }} />
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Six-month planting history */}
        <section className="mb-10" aria-labelledby="growth-heading">
          <div className="mb-5">
            <h2 id="growth-heading" className="font-serif text-2xl sm:text-3xl">Your growth</h2>
            <p className="mt-1 text-sm text-muted-foreground">Saplings you logged each month over the last six months.</p>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading your growth…</p>
          ) : plantings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <Sprout className="mx-auto h-10 w-10 text-primary-glow animate-leaf-sway" aria-hidden="true" />
              <h3 className="mt-3 font-serif text-xl sm:text-2xl">Your growth begins with one small step.</h3>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">Log your first sapling and your monthly progress will take shape here.</p>
              <Button asChild variant="forest" className="mt-5">
                <Link to="/app/log"><Plus className="h-4 w-4" /> Log a planting</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
              <ChartContainer config={growthChartConfig} className="h-[250px] w-full aspect-auto sm:h-[280px]">
                <BarChart data={monthlyGrowth} margin={{ top: 28, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis hide allowDecimals={false} domain={[0, (max: number) => Math.max(1, max + 1)]} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[5, 5, 0, 0]} maxBarSize={64}>
                    <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </section>

        {/* Weekly challenge + engagement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-10">
          <WeeklyChallenge />
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Link to="/app/posts" className="rounded-3xl bg-card border border-border p-4 sm:p-5 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-0.5">
              <Camera className="h-5 w-5 text-primary-glow" />
              <div className="mt-3 font-serif text-2xl sm:text-3xl">{postsCount}</div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1">Posts</div>
            </Link>
            <div className="rounded-3xl bg-card border border-border p-4 sm:p-5 shadow-soft">
              <Heart className="h-5 w-5 text-primary-glow" />
              <div className="mt-3 font-serif text-2xl sm:text-3xl">{likesReceived}</div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1">Likes</div>
            </div>
            <div className="rounded-3xl bg-card border border-border p-4 sm:p-5 shadow-soft">
              <MessageCircle className="h-5 w-5 text-primary-glow" />
              <div className="mt-3 font-serif text-2xl sm:text-3xl">{commentsReceived}</div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1">Comments</div>
            </div>
          </div>
        </div>

        {/* Recent plantings */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl">Recent plantings</h2>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to="/app/community">View community →</Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : plantings.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center">
              <Sprout className="h-10 w-10 mx-auto text-primary-glow animate-leaf-sway" />
              <h3 className="mt-4 font-serif text-2xl">Your forest starts here.</h3>
              <p className="mt-2 text-muted-foreground">Log your first sapling to begin earning rewards.</p>
              <Button asChild variant="forest" className="mt-6">
                <Link to="/app/log"><Plus className="h-4 w-4" /> Log first planting</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {plantings.map((p, i) => (
                <Link key={p.id} to={`/app/planting/${p.id}`} className="block text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
                <article className="rounded-2xl bg-card border border-border p-5 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-0.5 animate-grow-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-serif text-xl">{p.species}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {p.location}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(p.planted_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                      +{p.points_earned}
                    </div>
                  </div>
                </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Dashboard;
