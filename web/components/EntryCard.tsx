"use client";

import type { FoodEntry, Reviewer } from "@/lib/types";
import { cuisineStyle } from "@/lib/cuisine";
import { formatDistance } from "@/lib/geo";

interface Props {
  entry: FoodEntry;
  reviewer: Reviewer | undefined;
  distanceKm: number | null;
}

export default function EntryCard({ entry, reviewer, distanceKm }: Props) {
  const style = cuisineStyle(entry.cuisineType);
  const isVideo = entry.sourceType === "video";

  return (
    <article className="flex overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      {/* Placeholder visual — swapped for a Google Places photo once the API key is set up */}
      <div
        className={`flex w-24 shrink-0 items-center justify-center bg-gradient-to-br text-4xl sm:w-28 ${style.gradient}`}
        aria-hidden
      >
        {style.emoji}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {entry.restaurantName}
          </h3>
          {distanceKm != null && (
            <span className="text-sm font-medium text-red-600">
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {entry.dishName}
          <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">·</span>
          <span className="text-neutral-500 dark:text-neutral-400">{entry.cuisineType}</span>
        </p>
        {entry.note && (
          <p className="text-sm italic text-neutral-500 dark:text-neutral-400">
            “{entry.note}”
          </p>
        )}
        <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
          {entry.address}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {isVideo ? "🎥" : "✍️"} {reviewer?.name ?? entry.reviewerId}
            {entry.dateReviewed && (
              <span className="text-neutral-400">
                · {new Date(entry.dateReviewed).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
              </span>
            )}
          </span>
          <a
            href={entry.reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-red-600 underline-offset-2 hover:underline"
          >
            {isVideo ? "Watch review →" : "Read full review →"}
          </a>
        </div>
      </div>
    </article>
  );
}
