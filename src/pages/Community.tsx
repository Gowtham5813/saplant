import { useEffect, useState } from "react";
import { MapPin, Sprout, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  species: string;
  location: string;
  notes: string | null;
  planted_at: string;
  user_id: string;
  display_name?: string;
}

interface LeaderRow {
  id: string;
  display_name: string;
  total_saplings: number;
  total_points: number;
}

const Community = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: plantings }, { data: profiles }] = await Promise.all([
        supabase.from("plantings").select("id, species, location, notes, planted_at, user_id").eq("shared", true).order("planted_at", { ascending: false }).limit(30),
        supabase.from("profiles").select("id, display_name, total_saplings, total_points").order("total_saplings", { ascending: false }).limit(10),
      ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
      // Also fetch any missing profiles for the feed
      const missingIds = (plantings ?? []).map((p) => p.user_id).filter((id) => !profileMap.has(id));
      if (missingIds.length > 0) {
        const { data: extra } = await supabase.from("profiles").select("id, display_name").in("id", missingIds);
        (extra ?? []).forEach((p) => profileMap.set(p.id, p.display_name));
      }

      setFeed((plantings ?? []).map((p) => ({ ...p, display_name: profileMap.get(p.user_id) ?? "A planter" })));
      setLeaders(profiles ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 sm:py-10 md:py-14">
        <div className="mb-8 sm:mb-10 animate-fade-up">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">Community canopy</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl">Plantings from around the world.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Every entry is a real sapling. Cheer them on.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Feed */}
          <section className="lg:col-span-2 min-w-0">
            <h2 className="font-serif text-2xl mb-5">Latest plantings</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : feed.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center">
                <Sprout className="h-10 w-10 mx-auto text-primary-glow animate-leaf-sway" />
                <p className="mt-4 text-muted-foreground">The forest is quiet — be the first to share a planting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feed.map((p, i) => (
                  <article key={p.id} className="rounded-2xl bg-card border border-border p-6 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-0.5 animate-grow-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-moss text-primary-foreground font-serif text-lg shadow-soft">
                        {p.display_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{p.display_name}</div>
                        <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.planted_at), { addSuffix: true })}</div>
                      </div>
                      <div className="ml-auto text-lg animate-leaf-sway">🌱</div>
                    </div>
                    <div className="mt-4">
                      <div className="font-serif text-2xl">Planted a <span className="text-primary-glow">{p.species}</span></div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {p.location}
                      </div>
                      {p.notes && <p className="mt-3 text-sm text-foreground/80 leading-relaxed italic border-l-2 border-secondary pl-3">"{p.notes}"</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Leaderboard */}
          <aside>
            <h2 className="font-serif text-2xl mb-5">Top planters</h2>
            <div className="rounded-3xl bg-gradient-forest text-primary-foreground p-6 shadow-elevated grain relative">
              <div className="relative space-y-3">
                {leaders.length === 0 ? (
                  <p className="text-primary-foreground/70">No planters yet.</p>
                ) : (
                  leaders.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 rounded-xl bg-primary-foreground/5 p-3 border border-primary-foreground/10">
                      <div className="font-serif text-2xl text-secondary w-7">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{l.display_name}</div>
                        <div className="text-xs text-primary-foreground/60">{l.total_saplings} sapling{l.total_saplings === 1 ? "" : "s"}</div>
                      </div>
                      <div className="flex items-center gap-1 text-secondary text-sm font-semibold">
                        <Trophy className="h-3.5 w-3.5" /> {l.total_points}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Community;
