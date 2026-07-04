# SG Food Review Aggregator — Project Context

## 1. Overview

A website that aggregates food reviews from multiple well-known Singapore food
reviewers/bloggers into one place. Users find their current location (via
browser geolocation or manual postal code entry) and see famous, reviewed
food spots near them. They can filter/sort by reviewer, cuisine, and
distance, and click through to the original review on the reviewer's site.

**This is NOT a scraper.** Reviews are added manually (curated), stored as
structured data, and always link back to the original source. No review
text or photos are copied wholesale — entries are just the recommendation
itself (restaurant, dish, reviewer, link), with an optional short note.

## 2. Goals (MVP)

- Small demo scope: ~20–50 food entries across ~8–10 reviewers, mixing
  blog reviewers (long-form articles) and video reviewers (YouTube).
- User finds "food near me" via geolocation OR manual postal code entry.
- List/map view of nearby reviewed food, sortable by distance, filterable
  by reviewer and cuisine type.
- Each entry links out to the original reviewer's article.
- Restaurant photos sourced from Google Places API (not hotlinked from
  reviewer sites, to avoid copyright/hotlink issues).

## 3. Non-Goals (for now)

- No automated scraping of blogs/Instagram/YouTube (ToS + copyright risk,
  and too fragile across heterogeneous sources for this scale).
- No user accounts, reviews, or comments in MVP.
- No real-time review ingestion — data updates are manual.
- No native mobile app — responsive web only.

## 4. Data Model

Curated as a single JSON file for MVP (no database needed at 20–50 entries).
Suggested shape:

```json
{
  "id": "uuid-or-slug",
  "restaurantName": "string",
  "dishName": "string",
  "address": "string",
  "postalCode": "string",
  "lat": 1.2345,
  "lng": 103.4567,
  "cuisineType": "string (e.g. Chinese, Hawker, Cafe, Japanese)",
  "reviewerId": "string (references reviewer list below)",
  "sourceType": "blog | video — determines whether the UI shows 'Read review' or 'Watch review'",
  "note": "string, optional — a short tag/note if you want one (e.g. 'famous for laksa'). No summary is required; the recommendation itself (restaurant + dish + reviewer + link) is enough.",
  "reviewUrl": "string — link to the original article, or YouTube URL with timestamp (e.g. ?t=123s) for video reviewers covering multiple spots",
  "dateReviewed": "YYYY-MM-DD",
  "googlePlaceId": "string — used to fetch photo via Places API (used for ALL entries, blog or video, instead of hotlinking reviewer images or grabbing video thumbnails)"
}
```

Reviewer list (separate small JSON/config):

```json
[
  { "id": "ieatishootipost", "name": "Dr Leslie Tay", "type": "blog", "site": "https://ieatishootipost.sg" },
  { "id": "danielfooddiary", "name": "Daniel Ang", "type": "blog", "site": "https://danielfooddiary.com" },
  { "id": "ladyironchef", "name": "Brad Lau", "type": "blog", "site": "https://www.ladyironchef.com" },
  { "id": "misstamchiak", "name": "Maureen Ow", "type": "blog", "site": "https://www.misstamchiak.com" },
  { "id": "sethlui", "name": "Seth Lui", "type": "blog", "site": "https://sethlui.com" },
  { "id": "sgfoodonfoot", "name": "Derrick Tan", "type": "blog", "site": null },
  { "id": "explodingbelly", "name": "Clara Chua", "type": "blog", "site": null },
  { "id": "eatbook", "name": "Eatbook", "type": "video", "site": "https://eatbook.sg", "youtubeChannel": "https://www.youtube.com/@eatbooksg" },
  { "id": "alderic", "name": "Alderic Teo", "type": "video", "site": null, "youtubeChannel": "https://www.youtube.com/@Alderic." },
  { "id": "getfed", "name": "Get Fed", "type": "video", "site": null, "youtubeChannel": null }
]
```

Note: verify each reviewer's current site/handle before launch — influencer
accounts/sites change over time.

### Handling video-based reviewers (Eatbook, Alderic, Get Fed)

- **Metadata fetching is lower-risk than blog scraping**: unlike scraping a
  blog's HTML, pulling a video's title, description, publish date, and
  thumbnail via the official **YouTube Data API** is within YouTube's terms
  — it's a sanctioned API built for this. This can semi-automate metadata
  collection for video entries — no written summary is required, so most of
  the entry can be auto-filled (see Scaling Considerations below).
- **Location extraction**: some creators put addresses or Google Maps links
  directly in the video description (fetchable via the YouTube Data API),
  which can help pre-fill the `address` field — spot-check before geocoding.
- **Linking back**: since one video often covers multiple food spots, link
  to the video with a timestamp pointing at the relevant segment rather
  than just the video's start.
- **No thumbnails as restaurant photos**: thumbnails are the creator's own
  creative work — keep using Google Places API photos for consistency with
  blog entries.

## 5. Core Features (MVP)

1. **Location input**
   - Browser Geolocation API (primary, on permission grant)
   - Manual postal code fallback — geocode postal code to lat/lng via
     Google Geocoding API
2. **Nearby results**
   - Compute straight-line distance (Haversine formula) from user location
     to each entry's lat/lng — no need for Distance Matrix API at this scale
   - Sort by distance (default), or by "most recently reviewed"
3. **Filters**
   - By reviewer (multi-select)
   - By cuisine type
4. **Entry card**
   - Restaurant name, dish, cuisine, reviewer name/badge, optional note,
     distance from user, "Read full review →" / "Watch review →" link
     (opens reviewer's original article/video in new tab)
   - Photo via Google Places API (using googlePlaceId)
5. **Map view (optional but nice)**
   - Google Maps JS API showing pins for nearby entries, clicking a pin
     opens the entry card

## 6. Tech Stack (suggested — Claude Code can adjust)

- **Frontend**: Next.js (React) + Tailwind
- **Data**: static JSON file(s) checked into the repo for MVP (no DB
  required at this scale; easy to move to Supabase/Postgres later if the
  dataset grows or an admin UI is added)
- **APIs**:
  - Google Geocoding API (postal code → lat/lng)
  - Google Places API (photos, and optionally place details/ratings)
  - Google Maps JavaScript API (map view)
- **Hosting**: Vercel (pairs well with Next.js)

## 7. Legal / Copyright Notes

- Never store or display full review text or reviewer photos — only:
  restaurant/dish facts, an optional short original note, and a link to
  the source.
- Google Places photos are used for restaurant images instead of hotlinking
  reviewer content.
- Each entry must credit the reviewer and link to their original article.

## 9. Seed Data & How to Expand It

`seed-data.json` (delivered alongside this file) contains 22 real,
manually-sourced entries covering all 10 reviewers, mixing blog and video
sources. This is the reference implementation of the curation process —
follow the same method to add more:

1. **Find a real published recommendation.** Search the reviewer's own
   site/channel for a specific article or video (e.g. a "X best stalls at
   [hawker centre]" post, or a "best [dish]" ranking). Prefer pieces that
   already list a stall name + address, since that's most of the work
   done for you.
2. **Extract only facts, never text.** Pull out: restaurant/stall name,
   dish, address (if stated), cuisine type. Do NOT copy sentences from the
   review — the `note` field (optional) should be a short original phrase
   in your own words if you want one at all (e.g. "famous for laksa",
   "Michelin Bib Gourmand pick"), not a lifted description.
3. **Always keep the source link.** `reviewUrl` must point to the actual
   article or video the recommendation came from — this is both the
   attribution and the copyright safeguard.
4. **Leave `lat`, `lng`, and `googlePlaceId` as `null` at this stage.**
   These get filled in later via Google Places Autocomplete when the
   entry is actually imported into the app (see Scaling Considerations
   above) — don't hand-guess coordinates.
5. **If an address isn't stated in the source**, either search once more
   for the specific outlet address, or leave the address field with a
   note like "(confirm exact address via Google Places)" rather than
   guessing — see the `unionfarm-chickenrice` entry in seed-data.json for
   an example of this.
6. **sourceType is per-entry, not per-reviewer.** A reviewer who normally
   makes videos (like Eatbook) sometimes also publishes text articles —
   set `sourceType` based on the actual `reviewUrl`, not the reviewer's
   usual format.

## 10. Scaling Considerations

The MVP tech choices (static JSON, client-side Haversine distance) are fine
at ~50 entries but won't hold up unchanged if this grows. Worth designing
around these from the start so a future scale-up doesn't mean a rebuild:

### The real bottleneck: manual entry, not code
Since a full written summary is no longer required, adding an entry is
just: restaurant + dish + reviewer + link. That's already much faster than
writing prose — but at 500+ entries even that gets tedious by hand. The
fix isn't more scraping, it's a **faster manual entry workflow**:

- **Restaurant lookup via Google Places Autocomplete**: instead of typing
  address/lat/lng by hand, an admin form field with Places Autocomplete
  lets you type "xyz restaurant" and select the match — it auto-fills
  address, lat/lng, and `googlePlaceId` in one step.
- **Auto-fill from the link**: paste a review URL and auto-fill what's
  cheap to fetch:
  - Video (YouTube Data API): title, description, thumbnail, publish date
  - Blog: page title + Open Graph tags (`og:title`, `og:description`,
    `og:image`) via a simple metadata fetch — this is standard, sanctioned
    metadata (the same data Facebook/Twitter previews use), not scraping
    article content
  - You then just confirm the restaurant match (via Places Autocomplete)
    and pick reviewer + cuisine tag from dropdowns — a ~30 second task per
    entry instead of several minutes.
- **Bulk import**: once volume grows, support a CSV/spreadsheet upload
  for batches of entries instead of one-by-one form submission.
- **Later still — reviewer self-submission**: if this really takes off, a
  lightweight submission form reviewers themselves can fill (with your
  approval before it goes live) turns curation from "you add everything"
  into "you review and approve," which scales much better with volume.

### Data layer
- **JSON → database**: move to Supabase/Postgres once entries number in
  the hundreds; Next.js doesn't care where the data comes from, so this
  swap doesn't require a frontend rebuild.
- **Geospatial queries**: Haversine-over-a-JSON-array is fine at 50
  entries but slow at thousands. At scale, use a real spatial index
  (Postgres + PostGIS, or geohash-based bucketing) so "nearby" queries
  stay fast regardless of dataset size.

### API costs
- **Geocode once, cache forever**: Places/Geocoding calls happen once at
  data-entry time (via Autocomplete) and the result (lat/lng, place ID) is
  stored — never re-call these APIs per page view.
- **Cache Places photos**: fetch and cache photo URLs rather than calling
  the Places API on every page load.

### Infrastructure
- **Caching layer**: once there's real traffic, cache popular queries
  (e.g. "food near Orchard") with Redis or Next.js's built-in caching.
- **Hosting**: Vercel scales traffic automatically — not a concern early
  on.

## 11. Future Roadmap (post-MVP, not in scope now)

- Admin form for adding new entries faster (instead of hand-editing JSON)
- Migrate JSON → real database (Supabase/Postgres) as dataset grows
- RSS ingestion for reviewers who have feeds (semi-automated, still
  metadata-only, still manual review before publishing)
- User accounts, saved favorites
- More reviewers / broader coverage
