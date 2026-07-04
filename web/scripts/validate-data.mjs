// Validates data/entries.json and data/reviewers.json.
// Run with: npm run validate
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entries = JSON.parse(readFileSync(join(root, "data/entries.json"), "utf8"));
const reviewers = JSON.parse(readFileSync(join(root, "data/reviewers.json"), "utf8"));

const reviewerIds = new Set(reviewers.map((r) => r.id));
const problems = [];

// Singapore bounding box — catches swapped/garbage coordinates
const SG = { latMin: 1.15, latMax: 1.48, lngMin: 103.6, lngMax: 104.1 };

const seenIds = new Set();
for (const e of entries) {
  const where = e.id ?? "(missing id)";
  const require = (cond, msg) => { if (!cond) problems.push(`${where}: ${msg}`); };

  require(e.id, "missing id");
  require(!seenIds.has(e.id), "duplicate id");
  seenIds.add(e.id);

  require(e.restaurantName, "missing restaurantName");
  require(e.dishName, "missing dishName");
  require(e.address, "missing address");
  require(e.cuisineType, "missing cuisineType");
  require(reviewerIds.has(e.reviewerId), `unknown reviewerId "${e.reviewerId}"`);
  require(["blog", "video"].includes(e.sourceType), `bad sourceType "${e.sourceType}"`);

  require(typeof e.lat === "number" && typeof e.lng === "number", "missing lat/lng (run geocoder)");
  if (typeof e.lat === "number" && typeof e.lng === "number") {
    require(
      e.lat >= SG.latMin && e.lat <= SG.latMax && e.lng >= SG.lngMin && e.lng <= SG.lngMax,
      `coordinates (${e.lat}, ${e.lng}) outside Singapore`
    );
  }

  require(
    typeof e.reviewUrl === "string" && /^https?:\/\//.test(e.reviewUrl),
    "reviewUrl is not a valid http(s) URL"
  );
  if (e.reviewUrl) {
    require(
      !/\/(tag|category|search|feed)\//.test(e.reviewUrl) && !e.reviewUrl.endsWith("/feed/"),
      `reviewUrl looks like a tag/category/feed page, not an article: ${e.reviewUrl}`
    );
  }

  if (e.dateReviewed != null) {
    require(/^\d{4}-\d{2}-\d{2}$/.test(e.dateReviewed), `bad dateReviewed "${e.dateReviewed}"`);
  }
  if (e.postalCode != null) {
    require(/^\d{6}$/.test(e.postalCode), `bad postalCode "${e.postalCode}"`);
  }
}

const cuisines = [...new Set(entries.map((e) => e.cuisineType))].sort();
const perReviewer = Object.fromEntries(
  reviewers.map((r) => [r.id, entries.filter((e) => e.reviewerId === r.id).length])
);

console.log(`${entries.length} entries, ${reviewers.length} reviewers`);
console.log(`cuisines: ${cuisines.join(", ")}`);
console.log(`per reviewer: ${JSON.stringify(perReviewer)}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nAll checks passed ✔");
