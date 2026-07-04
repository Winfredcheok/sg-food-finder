"use client";

import type { Reviewer, SortMode, ViewMode } from "@/lib/types";

interface Props {
  reviewers: Reviewer[];
  cuisines: string[];
  selectedReviewers: Set<string>;
  selectedCuisines: Set<string>;
  sortMode: SortMode;
  viewMode: ViewMode;
  hasLocation: boolean;
  onToggleReviewer: (id: string) => void;
  onToggleCuisine: (cuisine: string) => void;
  onSortChange: (mode: SortMode) => void;
  onViewChange: (mode: ViewMode) => void;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-red-600 bg-red-600 text-white"
          : "border-neutral-300 text-neutral-700 hover:border-red-400 dark:border-neutral-700 dark:text-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterBar({
  reviewers,
  cuisines,
  selectedReviewers,
  selectedCuisines,
  sortMode,
  viewMode,
  hasLocation,
  onToggleReviewer,
  onToggleCuisine,
  onSortChange,
  onViewChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Reviewer
        </span>
        {reviewers.map((r) => (
          <Chip
            key={r.id}
            active={selectedReviewers.has(r.id)}
            onClick={() => onToggleReviewer(r.id)}
          >
            {r.type === "video" ? "🎥 " : "✍️ "}
            {r.name}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Cuisine
        </span>
        {cuisines.map((c) => (
          <Chip
            key={c}
            active={selectedCuisines.has(c)}
            onClick={() => onToggleCuisine(c)}
          >
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Sort
          </span>
          <Chip
            active={sortMode === "distance"}
            onClick={() => hasLocation && onSortChange("distance")}
          >
            {hasLocation ? "Nearest first" : "Nearest first (set location)"}
          </Chip>
          <Chip active={sortMode === "recent"} onClick={() => onSortChange("recent")}>
            Most recent
          </Chip>
        </div>
        <div className="flex overflow-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
          {(["list", "map"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewChange(mode)}
              className={`px-4 py-1.5 text-xs font-medium transition ${
                viewMode === mode
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {mode === "list" ? "☰ List" : "🗺️ Map"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
