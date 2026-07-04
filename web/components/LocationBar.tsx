"use client";

import { useState } from "react";
import type { UserLocation } from "@/lib/types";

interface Props {
  location: UserLocation | null;
  onLocationChange: (loc: UserLocation | null) => void;
}

export default function LocationBar({ location, onLocationChange }: Props) {
  const [postal, setPostal] = useState("");
  const [busy, setBusy] = useState<"gps" | "postal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by this browser — try a postal code.");
      return;
    }
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        });
        setBusy(null);
      },
      () => {
        setError("Couldn't get your location — try entering a postal code instead.");
        setBusy(null);
      },
      { timeout: 10000 }
    );
  }

  async function lookupPostal(e: React.FormEvent) {
    e.preventDefault();
    const q = postal.trim();
    if (!q) return;
    setError(null);
    setBusy("postal");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lookup failed");
      } else {
        onLocationChange({ lat: data.lat, lng: data.lng, label: data.label });
      }
    } catch {
      setError("Lookup failed — check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={useMyLocation}
          disabled={busy !== null}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {busy === "gps" ? "Locating…" : "📍 Use my location"}
        </button>
        <span className="text-sm text-neutral-400">or</span>
        <form onSubmit={lookupPostal} className="flex items-center gap-2">
          <input
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            placeholder="Postal code, e.g. 238867"
            inputMode="numeric"
            className="w-48 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="submit"
            disabled={busy !== null || !postal.trim()}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-red-500 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700"
          >
            {busy === "postal" ? "Finding…" : "Go"}
          </button>
        </form>
      </div>
      {location && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing food near <span className="font-medium">{location.label}</span>{" "}
          <button
            onClick={() => onLocationChange(null)}
            className="ml-1 text-red-600 underline-offset-2 hover:underline"
          >
            clear
          </button>
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
