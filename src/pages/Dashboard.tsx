import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, Trophy, TrendingUp, MapPin, Plus, Award, Camera, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

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

const BADGES = [
  { threshold: 1, name: "Seedling", icon: "🌱" },
  { threshold: 5, name: "Sprout", icon: "🌿" },
  { threshold: 10, name: "Sapling", icon: "🪴" },
  { threshold: 25, name: "Grove Keeper", icon: "🌳" },
  { threshold: 50, name: "Forest Guardian", icon: "🌲" },
  { threshold: 100, name: "Canopy Champion", icon: "🏆" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [commentsReceived, setCommentsReceived] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: p }, { data: pl }, { data: myPosts }] = await Promise.all([
      supabase.from("profiles").select("display_name, total_points, total_saplings").eq("id", user.id).maybeSingle(),
      supabase.from("plantings").select("id, species, location, planted_at, points_earned").eq("user_id", user.id).order("planted_at", { ascending: false }).limit(8),
      supabase.from("posts").select("id").eq("user_id", user.id),
    ]);
    setProfile(p);
    setPlantings(pl ?? []);
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
  const nextBadge = BADGES.find((b) => b.threshold > totalSaplings);
  const earnedBadges = BADGES.filter((b) => b.threshold <= totalSaplings);
  const co2Offset = (totalSaplings * 21).toFixed(0); // ~21kg CO2/year per young tree

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 sm:py-10 md:py-14">
        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 animate-fade-up">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">Your canopy</p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl break-words">
              Hello, {profile?.display_name ?? "Planter"}.
            </h1>
            <p className="mt-2 text-muted-foreground">Here's how your forest is growing.</p>
          </div>
          <Button asChild variant="forest" size="lg" className="w-full md:w-auto">
            <Link to="/app/log"><Plus className="h-4 w-4" /> Log a planting</Link>
          </Button>
        </div>

        {/* Stat bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 sm:gap-5 auto-rows-[minmax(160px,auto)] mb-10">
          <div className="md:col-span-2 rounded-3xl bg-gradient-forest p-6 sm:p-7 text-primary-foreground shadow-elevated grain relative overflow-hidden">
            <div className="relative">
              <Sprout className="h-7 w-7 text-secondary" />
              <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl">{totalSaplings}</div>
              <div className="text-xs sm:text-sm uppercase tracking-wider text-primary-foreground/70 mt-1">Saplings planted</div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-soft">
            <Trophy className="h-7 w-7 text-primary-glow" />
            <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl">{profile?.total_points ?? 0}</div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mt-1">Green points</div>
          </div>

          <div className="sm:col-span-2 md:col-span-2 rounded-3xl bg-secondary p-6 sm:p-7 shadow-soft">
            <TrendingUp className="h-7 w-7 text-secondary-foreground" />
            <div className="mt-4 sm:mt-6 font-serif text-5xl sm:text-6xl text-secondary-foreground break-words">{co2Offset}<span className="text-xl sm:text-2xl"> kg</span></div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-secondary-foreground/70 mt-1">CO₂ offset / yr</div>
          </div>

          {/* Next badge */}
          <div className="md:col-span-3 rounded-3xl bg-card border border-border p-6 sm:p-7 shadow-soft">
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
          <div className="md:col-span-3 rounded-3xl bg-surface-cream/70 border border-border p-6 sm:p-7">
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

        {/* Community engagement stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
          <Link to="/app/posts" className="rounded-3xl bg-card border border-border p-6 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-0.5">
            <Camera className="h-6 w-6 text-primary-glow" />
            <div className="mt-4 font-serif text-4xl">{postsCount}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Posts shared</div>
          </Link>
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <Heart className="h-6 w-6 text-primary-glow" />
            <div className="mt-4 font-serif text-4xl">{likesReceived}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Likes received</div>
          </div>
          <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
            <MessageCircle className="h-6 w-6 text-primary-glow" />
            <div className="mt-4 font-serif text-4xl">{commentsReceived}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Comments received</div>
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
              {plantings.map((p) => (
                <div key={p.id} className="rounded-2xl bg-card border border-border p-5 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-0.5">
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
                </div>
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
