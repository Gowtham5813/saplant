import { Link } from "react-router-dom";
import { ArrowRight, Sprout, Trophy, Users, BookOpen, MapPin, Bell, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingLeaves } from "@/components/FloatingLeaves";
import heroImage from "@/assets/hero-forest.jpg";
import saplingImage from "@/assets/sapling-closeup.jpg";
import aerialImage from "@/assets/forest-aerial.jpg";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Hands planting a young sapling in misty forest at golden hour"
              className="h-full w-full object-cover"
              width={1920}
              height={1080}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface-forest/40 via-surface-forest/50 to-background" />
            <FloatingLeaves count={16} />
          </div>

          <div className="container relative pt-16 pb-24 sm:pt-24 sm:pb-32 md:pt-36 md:pb-44">
            <div className="max-w-3xl animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground animate-pulse-ring">
                <Leaf className="h-3 w-3 animate-leaf-sway" /> Reforest. Reward. Repeat.
              </span>
              <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-7xl font-semibold leading-[1.05] text-primary-foreground text-balance">
                Plant a sapling.<br />
                <span className="italic text-shimmer">Earn the planet's gratitude.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg text-primary-foreground/90 leading-relaxed">
                Log every tree you plant, watch your impact grow, and join a community of green guardians turning small acts into lasting forests.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button asChild variant="forest" size="xl" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto">
                  <Link to="/auth">
                    Start planting <ArrowRight className="ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto">
                  <a href="#how">How it works</a>
                </Button>
              </div>

              <div className="mt-10 sm:mt-14 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg">
                {[
                  { v: "12k+", l: "Saplings logged" },
                  { v: "3.2k", l: "Active planters" },
                  { v: "84t", l: "CO₂ offset / yr" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-serif text-2xl sm:text-3xl md:text-4xl text-primary-foreground">{s.v}</div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-foreground/70 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="container py-16 sm:py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">How it works</span>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl text-balance">
              Three simple steps to a greener planet.
            </h2>
          </div>
          <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Plant a sapling", d: "Anywhere — your backyard, a community garden, a reforestation site." },
              { n: "02", t: "Log it in seconds", d: "Snap the species, location, and date. We award you green points instantly." },
              { n: "03", t: "Climb the canopy", d: "Earn badges, unlock rewards, and inspire others in your community feed." },
            ].map((step, i) => (
              <div key={step.n} className="group animate-grow-in rounded-3xl p-6 transition-organic hover:bg-card hover:shadow-soft" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="font-serif text-5xl sm:text-6xl text-primary-glow/30 transition-organic group-hover:text-primary-glow group-hover:-translate-y-1">{step.n}</div>
                <h3 className="mt-4 font-serif text-2xl">{step.t}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BENTO GRID FEATURES */}
        <section id="features" className="bg-surface-cream/60 py-16 sm:py-24 md:py-32">
          <div className="container">
            <div className="max-w-2xl mb-10 sm:mb-16">
              <span className="text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">Everything you need</span>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl text-balance">
                A forest of features, rooted in your impact.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-[minmax(180px,auto)]">
              {/* Hero feature - large */}
              <div className="md:col-span-4 md:row-span-2 relative overflow-hidden rounded-3xl shadow-elevated group">
                <img src={aerialImage} alt="Aerial view of reforested hillside" className="absolute inset-0 h-full w-full object-cover transition-organic group-hover:scale-105" loading="lazy" width={1024} height={1024} />
                <div className="absolute inset-0 bg-gradient-overlay" />
                <div className="relative h-full p-8 md:p-10 flex flex-col justify-end text-primary-foreground min-h-[420px]">
                  <Trophy className="h-8 w-8 mb-4 text-secondary" />
                  <h3 className="font-serif text-3xl md:text-4xl">Rewards that grow with you</h3>
                  <p className="mt-3 text-primary-foreground/80 max-w-md">
                    Earn 10 green points per sapling. Unlock badges, plant streaks, and partner discounts on eco-gear.
                  </p>
                </div>
              </div>

              {/* Tracker */}
              <div className="md:col-span-2 rounded-3xl bg-card border border-border p-7 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl">Planting tracker</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Log species, GPS, date — your full planting history at a glance.
                </p>
              </div>

              {/* Community */}
              <div className="md:col-span-2 rounded-3xl bg-primary text-primary-foreground p-7 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/10">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl">Community canopy</h3>
                <p className="mt-2 text-sm text-primary-foreground/70">
                  Share plantings, follow planters, celebrate milestones together.
                </p>
              </div>

              {/* Sapling visual */}
              <div className="md:col-span-2 row-span-1 relative overflow-hidden rounded-3xl shadow-soft min-h-[200px] group">
                <img src={saplingImage} alt="Close-up of a young green sapling" className="absolute inset-0 h-full w-full object-cover transition-organic group-hover:scale-105" loading="lazy" width={1024} height={1024} />
              </div>

              {/* Education */}
              <div className="md:col-span-2 rounded-3xl bg-card border border-border p-7 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl">Learn as you grow</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Species guides, planting tips, and the science behind your impact.
                </p>
              </div>

              {/* Reminders */}
              <div className="md:col-span-2 rounded-3xl bg-accent text-accent-foreground p-7 shadow-soft transition-organic hover:shadow-elevated hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-foreground/15">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl">Gentle reminders</h3>
                <p className="mt-2 text-sm text-accent-foreground/80">
                  Watering nudges and care tips, perfectly timed for each species.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMMUNITY CTA */}
        <section id="community" className="container py-16 sm:py-24 md:py-32">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-forest p-8 sm:p-12 md:p-20 shadow-elevated grain">
            <div className="relative max-w-2xl">
              <Sprout className="h-10 w-10 text-secondary animate-leaf-sway" />
              <h2 className="mt-6 font-serif text-3xl sm:text-4xl md:text-6xl text-primary-foreground text-balance">
                Your first sapling is waiting.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-primary-foreground/80 max-w-xl">
                Join thousands of planters quietly rebuilding the world's forests. Free to join. Free to plant.
              </p>
              <Button asChild size="xl" className="mt-8 sm:mt-10 bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto">
                <Link to="/auth">
                  Create your free account <ArrowRight className="ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
