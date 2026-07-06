import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — SG Food Finder",
  description:
    "How SG Food Finder works: curated recommendations from Singapore's best-known food reviewers, with full attribution.",
};

const CONTACT_EMAIL = "winfredcheok@gmail.com";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm font-medium text-red-600 underline-offset-2 hover:underline">
        ← Back to the food
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">About SG Food Finder</h1>

      <section className="mt-6 space-y-3 text-neutral-700 dark:text-neutral-300">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">The problem</h2>
        <p>
          Singapore has world-class food writing — but it lives scattered across a dozen blogs and
          YouTube channels, organised by article, not by <em>where you are</em>. Crowd-sourced star
          ratings answer &ldquo;what&apos;s nearby&rdquo; but not &ldquo;what&apos;s nearby that someone I trust has
          actually vetted&rdquo;. SG Food Finder bridges that: every spot here was recommended by one of
          Singapore&apos;s best-known food reviewers, and every entry links back to their original
          review or video.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">How it works</h2>
        <p>
          Entries are <strong>hand-curated, never scraped</strong>. From each published review we
          record only facts — the stall, the dish, the address — plus a short original note, then
          geocode it so you can sort by distance from wherever you&apos;re standing. Reading the actual
          review is a click away, on the reviewer&apos;s own site or channel, where it belongs.
        </p>
        <p>
          Restaurant photos come from Google Maps (with contributor attribution), not from the
          reviewers&apos; sites. Your location is used only inside your browser to compute distances —
          it is never stored or sent anywhere.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">For reviewers</h2>
        <p>
          This site exists to send readers <em>to</em> your work, not to replace it. Every entry
          credits you by name and links to your original piece; no review text or imagery is
          reproduced. If you&apos;re featured here and would like anything corrected, updated, or
          removed, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-red-600 underline-offset-2 hover:underline">
            {CONTACT_EMAIL}
          </a>{" "}
          and it will be handled promptly.
        </p>

        <h2 className="pt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">Disclaimers</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            SG Food Finder is an independent project. It is <strong>not affiliated with, endorsed
            by, or sponsored by</strong> any of the reviewers or publications referenced. All
            reviews remain the property of their respective authors.
          </li>
          <li>
            Entries summarise factual details (stall, dish, location) from publicly published
            recommendations. Opinions belong to the original reviewers — read their full pieces
            for the real verdicts.
          </li>
          <li>
            Hawker stalls move, close, and sell out. Details here may be outdated — please verify
            opening hours and prices before travelling. No warranty of any kind is given.
          </li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-neutral-800">
        Built in Singapore 🇸🇬 · Data curated by hand · <Link href="/" className="underline-offset-2 hover:underline">Home</Link>
      </footer>
    </main>
  );
}
