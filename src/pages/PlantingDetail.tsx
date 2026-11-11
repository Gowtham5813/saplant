import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Sprout } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

interface PlantingDetailRecord {
  id: string;
  species: string;
  location: string;
  notes: string | null;
  planted_at: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
}

const PlantingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [planting, setPlanting] = useState<PlantingDetailRecord | null>(null);
  const [planterName, setPlanterName] = useState("A planter");
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) {
        setUnavailable(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("plantings")
        .select("id, species, location, notes, planted_at, user_id, latitude, longitude")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setUnavailable(true);
        setLoading(false);
        return;
      }

      const record = data as PlantingDetailRecord;
      setPlanting(record);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", record.user_id)
        .maybeSingle();

      if (!active) return;
      setPlanterName(profile?.display_name ?? "A planter");
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const hasCoordinates = planting?.latitude != null && planting.longitude != null;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${planting.latitude},${planting.longitude}`
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-8 sm:py-10 md:py-14">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
            <Link to="/app/community"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>

          {loading ? (
            <p className="text-muted-foreground">Loading planting…</p>
          ) : unavailable || !planting ? (
            <section className="rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-soft">
              <Sprout className="mx-auto h-10 w-10 text-primary-glow" aria-hidden="true" />
              <h1 className="mt-4 font-serif text-2xl sm:text-3xl">Planting not found</h1>
              <p className="mt-2 text-muted-foreground">This planting may be private or no longer available.</p>
              <Button asChild variant="forest" className="mt-5">
                <Link to="/app/community">Back to community canopy</Link>
              </Button>
            </section>
          ) : (
            <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="bg-animated-forest px-6 py-8 text-primary-foreground sm:px-9 sm:py-10">
                <div className="flex items-center gap-2 text-sm text-primary-foreground/75">
                  <Sprout className="h-4 w-4 text-secondary" aria-hidden="true" />
                  <span>{planterName}</span>
                </div>
                <h1 className="mt-4 break-words font-serif text-3xl sm:text-4xl md:text-5xl">{planting.species}</h1>
                <p className="mt-2 text-primary-foreground/80">A sapling added to the canopy</p>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-9">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary-glow" aria-hidden="true" />
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date planted</h2>
                    <p className="mt-1 font-medium">{format(new Date(planting.planted_at), "MMMM d, yyyy")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-glow" aria-hidden="true" />
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</h2>
                    <p className="mt-1 font-medium">{planting.location}</p>
                    {hasCoordinates && mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        View map pin
                      </a>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 border-t border-border pt-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {planting.notes?.trim() || "No notes added for this planting."}
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default PlantingDetail;