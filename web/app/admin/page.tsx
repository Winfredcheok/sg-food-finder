"use client";

import { useState } from "react";
import reviewersData from "@/data/reviewers.json";
import type { Reviewer } from "@/lib/types";

const reviewers = reviewersData as Reviewer[];
const CUISINES = ["Hawker", "Chinese", "Peranakan", "Japanese", "Malay", "Desserts", "Cafe"];

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-neutral-500";

export default function AdminPage() {
  const [form, setForm] = useState({
    reviewUrl: "",
    restaurantName: "",
    dishName: "",
    address: "",
    postalCode: "",
    cuisineType: "Hawker",
    reviewerId: reviewers[0].id,
    sourceType: "blog",
    note: "",
    dateReviewed: "",
    lat: "",
    lng: "",
  });
  const [metaPreview, setMetaPreview] = useState<string | null>(null);
  const [geoPreview, setGeoPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function fetchMetadata() {
    setBusy("meta");
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/metadata?url=${encodeURIComponent(form.reviewUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMetaPreview(
        [data.siteName, data.title, data.datePublished].filter(Boolean).join(" · ") || "No metadata found"
      );
      if (data.datePublished) set("dateReviewed", data.datePublished);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Metadata fetch failed" });
    } finally {
      setBusy(null);
    }
  }

  async function lookupLocation() {
    setBusy("geo");
    setStatus(null);
    const q = form.postalCode.trim() || form.address.trim();
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, lat: String(data.lat), lng: String(data.lng) }));
      setGeoPreview(`${data.label} → ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Lookup failed" });
    } finally {
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setStatus(null);
    try {
      const res = await fetch("/api/admin/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({
        kind: "ok",
        msg: `Saved "${data.entry.restaurantName}" (id: ${data.entry.id}) — ${data.total} entries total. Places: ${data.placesStatus}`,
      });
      setForm((f) => ({
        ...f,
        reviewUrl: "",
        restaurantName: "",
        dishName: "",
        address: "",
        postalCode: "",
        note: "",
        dateReviewed: "",
        lat: "",
        lng: "",
      }));
      setMetaPreview(null);
      setGeoPreview(null);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Add a curated entry</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Local-only admin tool. Paste the review link, fetch its metadata, look up
        the location via OneMap, and save. Facts only — never copy review text.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Review URL (the original article/video)</label>
          <div className="mt-1 flex gap-2">
            <input
              required
              value={form.reviewUrl}
              onChange={(e) => set("reviewUrl", e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
            <button
              type="button"
              onClick={fetchMetadata}
              disabled={!form.reviewUrl || busy !== null}
              className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:border-red-500 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700"
            >
              {busy === "meta" ? "Fetching…" : "Fetch details"}
            </button>
          </div>
          {metaPreview && <p className="mt-1 text-xs text-neutral-500">{metaPreview}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Restaurant / stall name</label>
            <input required value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Dish</label>
            <input required value={form.dishName} onChange={(e) => set("dishName", e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Address</label>
          <input required value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Block, street, unit, Singapore + postal" className={`mt-1 ${inputCls}`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_1fr]">
          <div>
            <label className={labelCls}>Postal code</label>
            <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} inputMode="numeric" className={`mt-1 ${inputCls}`} />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={lookupLocation}
              disabled={busy !== null || (!form.postalCode.trim() && !form.address.trim())}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:border-red-500 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700"
            >
              {busy === "geo" ? "Looking up…" : "📍 OneMap lookup"}
            </button>
          </div>
          <div>
            <label className={labelCls}>Lat</label>
            <input required value={form.lat} onChange={(e) => set("lat", e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Lng</label>
            <input required value={form.lng} onChange={(e) => set("lng", e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
        </div>
        {geoPreview && <p className="-mt-2 text-xs text-emerald-600">{geoPreview}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Reviewer</label>
            <select
              value={form.reviewerId}
              onChange={(e) => {
                const r = reviewers.find((x) => x.id === e.target.value);
                setForm((f) => ({ ...f, reviewerId: e.target.value, sourceType: r?.type ?? f.sourceType }));
              }}
              className={`mt-1 ${inputCls}`}
            >
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Source type</label>
            <select value={form.sourceType} onChange={(e) => set("sourceType", e.target.value)} className={`mt-1 ${inputCls}`}>
              <option value="blog">blog (Read review)</option>
              <option value="video">video (Watch review)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Cuisine</label>
            <input list="cuisines" value={form.cuisineType} onChange={(e) => set("cuisineType", e.target.value)} className={`mt-1 ${inputCls}`} />
            <datalist id="cuisines">
              {CUISINES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div>
            <label className={labelCls}>Note (optional, your own words)</label>
            <input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder='e.g. "famous for laksa"' className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Date reviewed</label>
            <input type="date" value={form.dateReviewed} onChange={(e) => set("dateReviewed", e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy !== null}
          className="mt-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save entry"}
        </button>
        {status && (
          <p className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
            {status.msg}
          </p>
        )}
        <p className="text-xs text-neutral-400">
          Saved entries go to <code>web/data/entries.json</code> and <code>seed-data.json</code>.
          The dev server picks them up on reload; a production build needs <code>npm run build</code> again.
        </p>
      </form>
    </main>
  );
}
