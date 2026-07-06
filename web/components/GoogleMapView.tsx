"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import type { FoodEntry, Reviewer, UserLocation } from "@/lib/types";
import { SG_CENTER, formatDistance } from "@/lib/geo";
import { cuisineStyle } from "@/lib/cuisine";

function RecenterOnLocation({ location }: { location: UserLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && location) {
      map.panTo({ lat: location.lat, lng: location.lng });
      map.setZoom(14);
    }
  }, [location, map]);
  return null;
}

interface Props {
  entries: (FoodEntry & { distanceKm: number | null })[];
  reviewersById: Map<string, Reviewer>;
  location: UserLocation | null;
}

export default function GoogleMapView({ entries, reviewersById, location }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const center = location ?? SG_CENTER;
  const selected = entries.find((e) => e.id === openId) ?? null;
  const selectedReviewer = selected ? reviewersById.get(selected.reviewerId) : null;

  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}>
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: center.lat, lng: center.lng }}
          defaultZoom={location ? 14 : 12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          streetViewControl={false}
          mapTypeControl={false}
        >
          <RecenterOnLocation location={location} />
          {location && (
            <AdvancedMarker position={{ lat: location.lat, lng: location.lng }} zIndex={10}>
              <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow" />
            </AdvancedMarker>
          )}
          {entries.map((entry) => (
            <AdvancedMarker
              key={entry.id}
              position={{ lat: entry.lat, lng: entry.lng }}
              onClick={() => setOpenId(entry.id)}
            >
              <Pin background="#dc2626" borderColor="#991b1b" glyphColor="#fff" />
            </AdvancedMarker>
          ))}
          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              pixelOffset={[0, -36]}
              onCloseClick={() => setOpenId(null)}
            >
              <div className="max-w-56 space-y-1 text-neutral-900">
                {selected.photoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selected.photoUrl}
                    alt={selected.restaurantName}
                    className="h-24 w-full rounded object-cover"
                  />
                )}
                <p className="font-semibold">
                  {cuisineStyle(selected.cuisineType).emoji} {selected.restaurantName}
                </p>
                <p className="text-sm">
                  {selected.dishName} · {selected.cuisineType}
                  {selected.distanceKm != null && <> · {formatDistance(selected.distanceKm)}</>}
                </p>
                <p className="text-xs text-neutral-500">
                  {selected.sourceType === "video" ? "🎥" : "✍️"}{" "}
                  {selectedReviewer?.name ?? selected.reviewerId}
                </p>
                <a
                  href={selected.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-red-600"
                >
                  {selected.sourceType === "video" ? "Watch review →" : "Read full review →"}
                </a>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
