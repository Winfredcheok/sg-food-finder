"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { FoodEntry, Reviewer, SortMode, UserLocation, ViewMode } from "@/lib/types";
import { haversineKm } from "@/lib/geo";
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
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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

    const filtered = withDistance.filter(
      (e) =>
        (selectedReviewers.size === 0 || selectedReviewers.has(e.reviewerId)) &&
        (selectedCuisines.size === 0 || selectedCuisines.has(e.cuisineType))
    );

    if (sortMode === "distance" && location) {
      filtered.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else {
      filtered.sort((a, b) =>
        (b.dateReviewed ?? "0000").localeCompare(a.dateReviewed ?? "0000")
      );
    }
    return filtered;
  }, [entries, location, selectedReviewers, selectedCuisines, sortMode]);

  return (
    <div className="flex flex-col gap-5">
      <LocationBar location={location} onLocationChange={handleLocationChange} />
      <FilterBar
        reviewers={reviewers}
        cuisines={cuisines}
        selectedReviewers={selectedReviewers}
        selectedCuisines={selectedCuisines}
        sortMode={sortMode}
        viewMode={viewMode}
        hasLocation={location !== null}
        onToggleReviewer={(id) => setSelectedReviewers((s) => toggle(s, id))}
        onToggleCuisine={(c) => setSelectedCuisines((s) => toggle(s, c))}
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
