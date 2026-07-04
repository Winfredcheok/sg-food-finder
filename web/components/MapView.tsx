"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { FoodEntry, Reviewer, UserLocation } from "@/lib/types";
import { SG_CENTER, formatDistance } from "@/lib/geo";
import { cuisineStyle } from "@/lib/cuisine";

// Leaflet's default icon URLs break under bundlers; point them at the CDN copies.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterOnLocation({ location }: { location: UserLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.lat, location.lng], 14);
  }, [location, map]);
  return null;
}

interface Props {
  entries: (FoodEntry & { distanceKm: number | null })[];
  reviewersById: Map<string, Reviewer>;
  location: UserLocation | null;
}

export default function MapView({ entries, reviewersById, location }: Props) {
  const center = location ?? SG_CENTER;

  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={location ? 14 : 12}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnLocation location={location} />
        {location && (
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={9}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9 }}
          >
            <Popup>{location.label}</Popup>
          </CircleMarker>
        )}
        {entries.map((entry) => {
          const reviewer = reviewersById.get(entry.reviewerId);
          const style = cuisineStyle(entry.cuisineType);
          return (
            <Marker key={entry.id} position={[entry.lat, entry.lng]} icon={markerIcon}>
              <Popup>
                <div className="min-w-48 space-y-1">
                  <p className="font-semibold">
                    {style.emoji} {entry.restaurantName}
                  </p>
                  <p className="text-sm">
                    {entry.dishName} · {entry.cuisineType}
                    {entry.distanceKm != null && (
                      <> · {formatDistance(entry.distanceKm)}</>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {entry.sourceType === "video" ? "🎥" : "✍️"}{" "}
                    {reviewer?.name ?? entry.reviewerId}
                  </p>
                  <a
                    href={entry.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-red-600"
                  >
                    {entry.sourceType === "video" ? "Watch review →" : "Read full review →"}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
