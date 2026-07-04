"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { FoodEntry, Reviewer, SortMode, UserLocation, ViewMode } from "@/lib/types";
import { haversineKm } from "@/lib/geo";
import { regionOf } from "@/lib/region";
import LocationBar from "./LocationBar";
import FilterBar from "./FilterBar";
import EntryCard from "./EntryCard";

// Leaflet touches `window` at import time, so the map can only render client-side
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-neutral-200 text-neutral-500 dark:border-neutral-800">
      Loading map…
    </div>
  ),
});

interface Props {
  entries: FoodEntry[];
  reviewers: Reviewer[];
}

export default function FoodFinder({ entries, reviewers }: Props) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<Set<string>>(new Set());
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");

  const reviewersById = useMemo(
    () => new Map(reviewers.map((r) => [r.id, r])),
    [reviewers]
  );
  const cuisines = useMemo(
    () => [...new Set(entries.map((e) => e.cuisineType))].sort(),
    [entries]
  );

  function handleLocationChange(loc: UserLocation | null) {
    setLocation(loc);
    setSortMode(loc ? "distance" : "recent");
  }

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  const visible = useMemo(() => {
    const withDistance = entries.map((e) => ({
      ...e,
      distanceKm: location ? haversineKm(location.lat, location.lng, e.lat, e.lng) : null,
    }));

    // Token search: every word must appear somewhere in the entry, so
    // "chicken rice" matches Hainanese Chicken Rice regardless of word order.
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = withDistance.filter((e) => {
      if (selectedReviewers.size > 0 && !selectedReviewers.has(e.reviewerId)) return false;
      if (selectedCuisines.size > 0 && !selectedCuisines.has(e.cuisineType)) return false;
      if (selectedRegions.size > 0 && !selectedRegions.has(regionOf(e.lat, e.lng))) return false;
      if (tokens.length === 0) return true;
      const haystack = [
        e.restaurantName,
        e.dishName,
        e.address,
        e.note ?? "",
        e.cuisineType,
        reviewersById.get(e.reviewerId)?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });

    if (sortMode === "distance" && location) {
      filtered.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else {
      filtered.sort((a, b) =>
        (b.dateReviewed ?? "0000").localeCompare(a.dateReviewed ?? "0000")
      );
    }
    return filtered;
  }, [entries, location, selectedReviewers, selectedCuisines, selectedRegions, sortMode, query, reviewersById]);

  return (
    <div className="flex flex-col gap-5">
      <LocationBar location={location} onLocationChange={handleLocationChange} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search anything — chicken rice, laksa, Maxwell, Michelin…"
        className="w-full rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm text-neutral-900 outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 sm:max-w-md"
      />
      <FilterBar
        reviewers={reviewers}
        cuisines={cuisines}
        selectedReviewers={selectedReviewers}
        selectedCuisines={selectedCuisines}
        selectedRegions={selectedRegions}
        sortMode={sortMode}
        viewMode={viewMode}
        hasLocation={location !== null}
        onToggleReviewer={(id) => setSelectedReviewers((s) => toggle(s, id))}
        onToggleCuisine={(c) => setSelectedCuisines((s) => toggle(s, c))}
        onToggleRegion={(r) => setSelectedRegions((s) => toggle(s, r))}
        onSortChange={setSortMode}
        onViewChange={setViewMode}
      />

      <p className="text-sm text-neutral-500">
        {visible.length} of {entries.length} spots
        {location && sortMode === "distance" && " · nearest first"}
      </p>

      {viewMode === "map" ? (
        <MapView entries={visible} reviewersById={reviewersById} location={location} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              reviewer={reviewersById.get(entry.reviewerId)}
              distanceKm={entry.distanceKm}
            />
          ))}
          {visible.length === 0 && (
            <p className="py-12 text-center text-neutral-500 lg:col-span-2">
              No spots match those filters — try removing one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
