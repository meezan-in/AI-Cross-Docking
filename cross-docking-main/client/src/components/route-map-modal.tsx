import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cityCoordinates } from "@/lib/cities";
import indiaBoundary from "@/lib/india-boundary.json";

// Fix for missing default marker icon in Leaflet with Webpack/Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Set default icon for all markers
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom SVG location (tear drop) icon
const locationIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="%233B82F6" d="M16 2C9.373 2 4 7.373 4 14c0 7.732 10.07 15.36 10.497 15.67a1 1 0 0 0 1.006 0C17.93 29.36 28 21.732 28 14c0-6.627-5.373-12-12-12zm0 26.013C13.13 25.01 6 18.98 6 14c0-5.514 4.486-10 10-10s10 4.486 10 10c0 4.98-7.13 11.01-10 14.013z"/><circle cx="16" cy="14" r="5" fill="%23fff"/></svg>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// RouteMapModal: Displays an optimized route using Leaflet and OpenStreetMap in a modal popup.
// Pure Leaflet implementation to avoid React-Leaflet modal issues.

interface RouteMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: string[]; // Array of city names in order
}

const centerOfIndia: [number, number] = [22.5937, 78.9629];
const indiaBounds: [[number, number], [number, number]] = [
  [6, 67],
  [37, 90],
]; // SW and NE corners

export default function RouteMapModal({
  open,
  onOpenChange,
  route,
}: RouteMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadCoords, setRoadCoords] = useState<[number, number][]>([]);

  // Convert city names to coordinates
  const points = route
    .map((city) => cityCoordinates[city])
    .filter(Boolean)
    .map((coord) => [coord.lat, coord.lon]);

  const missingCities = route.filter((city) => !cityCoordinates[city]);

  // Wait until modal is open and DOM is painted
  useEffect(() => {
    if (open) {
      setTimeout(() => setReady(true), 400);
    } else {
      setReady(false);
      setRoadCoords([]);
      setLoading(false);
      setMapError(null);
    }
  }, [open]);

  // Fetch OSRM road route when ready and points are available
  useEffect(() => {
    if (!ready || points.length < 2 || missingCities.length > 0) return;
    setLoading(true);
    setMapError(null);
    setRoadCoords([]);

    // Helper to fetch one segment
    const fetchSegment = async (
      from: [number, number],
      to: [number, number]
    ) => {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
      const data = await res.json();
      if (!data.routes || !data.routes[0]) throw new Error("No route found");
      return data.routes[0].geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon]
      );
    };

    (async () => {
      try {
        let allCoords: [number, number][] = [];
        for (let i = 0; i < points.length - 1; i++) {
          const seg = await fetchSegment(points[i], points[i + 1]);
          // Avoid duplicate points at segment joins
          if (allCoords.length > 0) seg.shift();
          allCoords = allCoords.concat(seg);
        }
        setRoadCoords(allCoords);
      } catch (e) {
        setMapError("Failed to fetch road route: " + (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, route]);

  // Draw map with road route
  useEffect(() => {
    let timeout: any;
    if (
      !ready ||
      !mapRef.current ||
      typeof mapRef.current === "undefined" ||
      points.length === 0 ||
      missingCities.length > 0 ||
      loading
    )
      return;

    setMapError(null);

    timeout = setTimeout(() => {
      try {
        // Defensive: check mapRef.current again
        if (!mapRef.current) {
          setMapError("Map container not available.");
          return;
        }
        // Clean up previous map instance
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }
        // Create map
        const map = L.map(mapRef.current, {
          center: centerOfIndia,
          zoom: 5.2,
          minZoom: 4,
          maxZoom: 10,
          maxBounds: indiaBounds,
          maxBoundsViscosity: 1.0,
        });
        leafletMapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        // Overlay India boundary GeoJSON
        L.geoJSON(indiaBoundary, {
          style: {
            color: "#2563eb", // blue border
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.08,
          },
        }).addTo(map);
        // Add road polyline if available, else fallback to straight line
        if (roadCoords.length > 1) {
          L.polyline(roadCoords, { color: "blue", weight: 4 }).addTo(map);
          // Only fit bounds if route covers a significant distance
          const lats = roadCoords.map(([lat]) => lat);
          const lons = roadCoords.map(([, lon]) => lon);
          const latDiff = Math.max(...lats) - Math.min(...lats);
          const lonDiff = Math.max(...lons) - Math.min(...lons);
          if (latDiff > 1 || lonDiff > 1) {
            map.fitBounds(roadCoords as [number, number][]);
          }
        } else if (points.length > 1) {
          L.polyline(points, {
            color: "gray",
            weight: 2,
            dashArray: "6",
          }).addTo(map);
          const lats = points.map(([lat]) => lat);
          const lons = points.map(([, lon]) => lon);
          const latDiff = Math.max(...lats) - Math.min(...lats);
          const lonDiff = Math.max(...lons) - Math.min(...lons);
          if (latDiff > 1 || lonDiff > 1) {
            map.fitBounds(points as [number, number][]);
          }
        }
        // Add markers
        points.forEach((pos, idx) => {
          L.marker(pos as [number, number], { icon: locationIcon })
            .addTo(map)
            .bindPopup(route[idx]);
        });
        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      } catch (e) {
        setMapError("Map failed to initialize: " + (e as Error).message);
        console.error("Leaflet map error:", e);
      }
    }, 0); // Run after paint

    return () => {
      clearTimeout(timeout);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, roadCoords, loading, route]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]" style={{ maxWidth: 900 }}>
        <DialogHeader>
          <DialogTitle>Optimized Delivery Route</DialogTitle>
        </DialogHeader>
        {mapError && (
          <div className="p-6 text-center text-red-500">{mapError}</div>
        )}
        {loading && (
          <div className="p-6 text-center text-muted-foreground">
            Loading real road route...
          </div>
        )}
        {route.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No route to display.
          </div>
        ) : missingCities.length > 0 ? (
          <div className="p-6 text-center text-red-500">
            Some cities are missing coordinates: {missingCities.join(", ")}
          </div>
        ) : points.length === 0 ? (
          <div className="p-6 text-center text-red-500">
            No valid coordinates found for route: {JSON.stringify(route)}
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-2">
              The blue line shows the real road route between cities, powered by
              OSRM.
            </div>
            <div
              ref={mapRef}
              style={{
                height: 500,
                width: "100%",
                borderRadius: 8,
                overflow: "hidden",
              }}
              id="leaflet-map"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
