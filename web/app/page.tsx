import FoodFinder from "@/components/FoodFinder";
import entriesData from "@/data/entries.json";
import reviewersData from "@/data/reviewers.json";
import type { FoodEntry, Reviewer } from "@/lib/types";

export default function Home() {
  const entries = entriesData as FoodEntry[];
  const reviewers = reviewersData as Reviewer[];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">🇸🇬 SG Food Finder</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Food spots reviewed by Singapore&apos;s best-known food reviewers — find
          what&apos;s good near you. Every entry links back to the original review.
        </p>
      </header>
      <FoodFinder entries={entries} reviewers={reviewers} />
      <footer className="mt-12 border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-neutral-800">
        All recommendations are curated from — and credited to — the original
        reviewers; this site is not affiliated with or endorsed by them. Click
        through to read or watch their full reviews. Photos from Google Maps.{" "}
        <a href="/about" className="text-red-600 underline-offset-2 hover:underline">
          About, attribution &amp; disclaimers →
        </a>
      </footer>
    </main>
  );
}
