# SG Food Finder

**Live site:** https://sg-food-finder.vercel.app
(Auto-deploys from `main` via the Vercel GitHub integration; root directory `web/`.
Note for networks with TLS inspection: point `NODE_EXTRA_CA_CERTS` at your CA
bundle if Node-based tools fail with certificate errors.)

A curated aggregator of food recommendations from Singapore's best-known food
reviewers. Users share their location (browser geolocation or postal code) and
see famous, reviewed food spots near them — filterable by reviewer and cuisine,
sorted by distance, with every entry linking back to the original review.

**Not a scraper.** Entries are curated by hand (see `context.md` for the full
method and legal notes): facts only — stall, dish, address, reviewer, link —
never copied review text or photos.

## Layout

| Path | What |
|---|---|
| `context.md` | Project brief: goals, data model, curation method, scaling notes |
| `seed-data.json` | Source-of-truth curated entries (34, all geocoded) |
| `web/` | Next.js 16 app (React 19, Tailwind 4, Leaflet) |
| `web/data/entries.json` | App copy of the entry data (kept in sync) |
| `web/data/reviewers.json` | Reviewer registry (10 reviewers, blog + video) |

## Run it

Requires Node 18+ (this machine: `~/.local/node/bin`).

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run validate   # data sanity checks (schema, coords, URLs, duplicates)
npm run build && npm start   # production
```

## Key implementation notes

- **Geocoding is free**: Singapore's official [OneMap](https://www.onemap.gov.sg)
  API geocodes postal codes/addresses without an API key — used both at
  curation time (`/api/geocode` + the scripts) and for user postal-code lookup.
- **Map is free**: Leaflet + OpenStreetMap tiles, no key needed.
- **Photos are pending**: entry cards show cuisine-based placeholders until a
  Google Cloud key is available; then swap in Places API photos via each
  entry's `googlePlaceId` — and **switch the map to Google Maps JS at the same
  time** (Google's ToS disallows showing Places content on a non-Google map).
- **Distance** is client-side Haversine — fine at this scale (see context.md
  §10 for the scale-up path).

## Adding entries

Open **http://localhost:3000/admin** (local-only tool):
paste the review URL → *Fetch details* (pulls Open Graph title/date — sanctioned
metadata, not scraping) → fill stall/dish → *OneMap lookup* for coordinates →
save. It appends to both data files; run `npm run validate` after.

Curation rules live in `context.md` §9 — facts only, always link the source,
never guess addresses.
