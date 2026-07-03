import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PlantingPoint {
  id: string;
  species: string;
  location: string;
  planted_at: string;
  latitude: number;
  longitude: number;
  planter: string;
}

declare global {
  interface Window {
    google: any;
    __initSaplantMap?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

let mapsLoader: Promise<void> | null = null;
const loadGoogleMaps = () => {
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) return resolve();
    if (!BROWSER_KEY) return reject(new Error("Missing Google Maps browser key"));
    window.__initSaplantMap = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__initSaplantMap",
      libraries: "marker",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
};

const PlantingsMap = () => {
  const [points, setPoints] = useState<PlantingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

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

  useEffect(() => {
    if (loading || !mapEl.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapEl.current) return;
        const google = window.google;
        const center = points.length
          ? { lat: points[0].latitude, lng: points[0].longitude }
          : { lat: 20, lng: 0 };

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(mapEl.current, {
            center,
            zoom: points.length ? 3 : 2,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          });
          infoRef.current = new google.maps.InfoWindow();
        }

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) => {
          const marker = new google.maps.Marker({
            position: { lat: p.latitude, lng: p.longitude },
            map: mapRef.current,
            title: p.species,
            label: { text: "🌱", fontSize: "18px" },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          marker.addListener("click", () => {
            infoRef.current.setContent(`
              <div style="font-family:sans-serif;min-width:180px">
                <div style="font-weight:600">🌱 ${p.species}</div>
                <div style="font-size:12px;color:#555;margin-top:2px">📍 ${p.location}</div>
                <div style="font-size:12px;color:#666;margin-top:4px">by ${p.planter}</div>
                <div style="font-size:12px;color:#888">${formatDistanceToNow(new Date(p.planted_at), { addSuffix: true })}</div>
              </div>`);
            infoRef.current.open({ anchor: marker, map: mapRef.current });
          });
          markersRef.current.push(marker);
          bounds.extend({ lat: p.latitude, lng: p.longitude });
        });

        if (points.length > 1) mapRef.current.fitBounds(bounds, 60);
      })
      .catch((e) => toast.error(e.message || "Google Maps failed to load"));

    return () => {
      cancelled = true;
    };
  }, [loading, points]);

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

        <div className="rounded-3xl overflow-hidden border border-border shadow-elevated h-[70vh] min-h-[420px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/50 z-10">
              Loading map…
            </div>
          )}
          <div ref={mapEl} className="h-full w-full" />
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
