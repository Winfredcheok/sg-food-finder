import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FoodEntry } from "@/lib/types";

// Appends a new curated entry to the data files. Local-only tooling:
// on Vercel the filesystem is read-only and this route is blocked anyway.
// Writes both web/data/entries.json (app data) and ../seed-data.json
// (source-of-truth copy alongside context.md) to keep them in sync.

const APP_DATA = join(process.cwd(), "data", "entries.json");
const SEED_DATA = join(process.cwd(), "..", "seed-data.json");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Best-effort Places enrichment at save time (same flow as the bulk
// curation script): place ID + one photo URL with author attribution.
// Photo URLs are resolved once here so visitors never trigger Places calls.
async function enrichWithPlaces(entry: FoodEntry): Promise<string> {
  const key = process.env.GOOGLE_SERVER_KEY;
  if (!key) return "skipped (no GOOGLE_SERVER_KEY)";
  try {
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
      },
      body: JSON.stringify({
        textQuery: `${entry.restaurantName}, ${entry.address}`,
        regionCode: "SG",
      }),
      signal: AbortSignal.timeout(10000),
    });
    const search = await searchRes.json();
    const place = search.places?.[0];
    if (!place) return "no Places match — photo placeholder will be used";

    entry.googlePlaceId = place.id;
    const photo = place.photos?.[0];
    if (photo) {
      const mediaRes = await fetch(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true&key=${key}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const media = await mediaRes.json();
      entry.photoUrl = media.photoUri ?? null;
      entry.photoAttribution = photo.authorAttributions?.[0]?.displayName ?? null;
    }
    return `matched "${place.displayName?.text}"${entry.photoUrl ? " with photo" : ", no photo"}`;
  } catch {
    return "Places lookup failed — entry saved without photo";
  }
}

export async function POST(request: NextRequest) {
  // Local-only: Next itself sets x-forwarded-for, so allow loopback client
  // IPs and reject anything else (LAN devices, tunnels, proxies, Vercel).
  const client = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
  const isLoopback = ["", "127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"].includes(client);
  if (process.env.VERCEL || !isLoopback || request.headers.get("cf-connecting-ip")) {
    return NextResponse.json({ error: "Admin tools are local-only" }, { status: 403 });
  }

  const body = await request.json();
  const required = ["restaurantName", "dishName", "address", "cuisineType", "reviewerId", "sourceType", "reviewUrl", "lat", "lng"];
  const missing = required.filter((k) => body[k] == null || body[k] === "");
  if (missing.length) {
    return NextResponse.json({ error: `Missing: ${missing.join(", ")}` }, { status: 400 });
  }
  if (!/^https?:\/\//.test(body.reviewUrl)) {
    return NextResponse.json({ error: "reviewUrl must be an http(s) link" }, { status: 400 });
  }

  const entries: FoodEntry[] = JSON.parse(await readFile(APP_DATA, "utf8"));

  let id = slugify(body.restaurantName);
  const ids = new Set(entries.map((e) => e.id));
  for (let n = 2; ids.has(id); n++) id = `${slugify(body.restaurantName)}-${n}`;

  const entry: FoodEntry = {
    id,
    restaurantName: body.restaurantName,
    dishName: body.dishName,
    address: body.address,
    postalCode: body.postalCode || null,
    lat: Number(body.lat),
    lng: Number(body.lng),
    cuisineType: body.cuisineType,
    reviewerId: body.reviewerId,
    sourceType: body.sourceType,
    note: body.note || null,
    reviewUrl: body.reviewUrl,
    dateReviewed: body.dateReviewed || null,
    googlePlaceId: null,
    photoUrl: null,
    photoAttribution: null,
  };

  const placesStatus = await enrichWithPlaces(entry);

  const updated = [...entries, entry];
  const json = JSON.stringify(updated, null, 2) + "\n";
  await writeFile(APP_DATA, json);
  try {
    await writeFile(SEED_DATA, json);
  } catch {
    // seed copy is best-effort; the app data write is what matters
  }

  return NextResponse.json({ ok: true, entry, total: updated.length, placesStatus });
}
