import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sprout, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const SPECIES_SUGGESTIONS = ["Oak", "Pine", "Maple", "Mango", "Neem", "Banyan", "Birch", "Eucalyptus", "Acacia", "Willow"];

const schema = z.object({
  species: z.string().trim().min(1, "Species required").max(80),
  location: z.string().trim().min(1, "Location required").max(120),
  notes: z.string().trim().max(500).optional(),
});

const LogPlanting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [shared, setShared] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const grabLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured — will appear on the map 🌍");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({ species, location, notes });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);

    setLoading(true);
    const { error } = await supabase.from("plantings").insert({
      user_id: user.id,
      species: parsed.data.species,
      location: parsed.data.location,
      notes: parsed.data.notes || null,
      shared,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sapling logged! +10 green points 🌱");
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 sm:py-10 md:py-16">
        <div className="max-w-2xl mx-auto animate-fade-up">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="mb-6 -ml-3">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Button>

          <div className="mb-8 sm:mb-10">
            <Sprout className="h-10 w-10 text-primary-glow animate-leaf-sway" />
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl">Log a new sapling</h1>
            <p className="mt-3 text-muted-foreground">A few details — and 10 green points are yours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-card border border-border p-5 sm:p-8 shadow-soft">
            <div>
              <Label htmlFor="species">Species *</Label>
              <Input
                id="species"
                list="species-list"
                placeholder="e.g. Oak, Mango, Neem…"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                required
              />
              <datalist id="species-list">
                {SPECIES_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g. Backyard, Mumbai, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Soil type, weather, or a story…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="rounded-2xl bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Label className="cursor-pointer">Pin on map</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {coords ? `Captured (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : "Add coordinates so this sapling appears on the world map."}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={grabLocation} disabled={locating} className="shrink-0">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {coords ? "Retry" : "Use my location"}
                </Button>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <Label htmlFor="shared" className="cursor-pointer">Share with community</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Inspire other planters in the feed.</p>
                </div>
                <Switch id="shared" checked={shared} onCheckedChange={setShared} />
              </div>
            </div>

            <Button type="submit" variant="forest" size="lg" className="w-full" disabled={loading}>
              {loading ? "Planting…" : "Log sapling · earn 10 points"}
            </Button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default LogPlanting;
