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

export async function POST(request: NextRequest) {
  // Local-only: also reject anything arriving through a tunnel/proxy
  // (forwarded requests carry x-forwarded-for / cf-connecting-ip headers).
  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("cf-connecting-ip");
  if (process.env.VERCEL || forwarded) {
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
  };

  const updated = [...entries, entry];
  const json = JSON.stringify(updated, null, 2) + "\n";
  await writeFile(APP_DATA, json);
  try {
    await writeFile(SEED_DATA, json);
  } catch {
    // seed copy is best-effort; the app data write is what matters
  }

  return NextResponse.json({ ok: true, entry, total: updated.length });
}
