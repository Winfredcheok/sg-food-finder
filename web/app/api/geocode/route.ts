import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Geocodes a Singapore postal code (or free-text address) via OneMap.
// OneMap is Singapore's official, free geocoding service — no API key needed.
// Proxied server-side to avoid browser CORS issues and to keep the option of
// swapping in Google Geocoding later without touching the client.
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!rateLimit(`geocode:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many lookups — try again in a minute" },
      { status: 429 }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
    query
  )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Geocoding service returned ${res.status}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) {
    return NextResponse.json(
      { error: "No match found for that postal code" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    lat: Number(hit.LATITUDE),
    lng: Number(hit.LONGITUDE),
    label: hit.ADDRESS ?? query,
  });
}
