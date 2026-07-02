import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Sprout, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Inline SVG marker so we don't depend on Leaflet's default image assets.
const leafIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;border-radius:50% 50% 50% 0;
    background:hsl(var(--primary));transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 12px rgba(0,0,0,0.25);border:2px solid white;">
    <span style="transform:rotate(45deg);color:white;font-size:16px;">🌱</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

interface PlantingPoint {
  id: string;
  species: string;
  location: string;
  planted_at: string;
  latitude: number;
  longitude: number;
  planter: string;
}

const PlantingsMap = () => {
  const [points, setPoints] = useState<PlantingPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: plantings, error } = await supabase
        .from("plantings")
        .select("id, user_id, species, location, planted_at, latitude, longitude")
        .eq("shared", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) {
        toast.error("Could not load map");
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set((plantings ?? []).map((p) => p.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
        : { data: [] as { id: string; display_name: string }[] };
      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

      setPoints(
        (plantings ?? []).map((p) => ({
          id: p.id,
          species: p.species,
          location: p.location,
          planted_at: p.planted_at,
          latitude: p.latitude as number,
          longitude: p.longitude as number,
          planter: nameMap.get(p.user_id) ?? "A planter",
        })),
      );
      setLoading(false);
    })();
  }, []);

  const center: [number, number] = points.length
    ? [points[0].latitude, points[0].longitude]
    : [20, 0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-8 sm:py-10 md:py-14">
        <div className="mb-6 animate-fade-up">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-glow font-semibold">Global canopy</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl">Plantings map</h1>
          <p className="mt-2 text-muted-foreground">
            Every pin is a sapling logged with coordinates. {points.length} on the map.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-border shadow-elevated h-[70vh] min-h-[420px]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">Loading map…</div>
          ) : (
            <MapContainer
              center={center}
              zoom={points.length ? 3 : 2}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {points.map((p) => (
                <Marker key={p.id} position={[p.latitude, p.longitude]} icon={leafIcon}>
                  <Popup>
                    <div className="font-sans">
                      <div className="font-semibold flex items-center gap-1">
                        <Sprout className="h-3.5 w-3.5" /> {p.species}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">by {p.planter}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(p.planted_at), { addSuffix: true })}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {!loading && points.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            No geolocated plantings yet — log one with "Use my location" to plant the first pin.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default PlantingsMap;
