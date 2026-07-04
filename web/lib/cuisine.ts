// Placeholder visuals until Google Places photos are wired in.
// Each cuisine gets an emoji + gradient so cards and map popups stay distinct.
const CUISINE_STYLES: Record<string, { emoji: string; gradient: string }> = {
  Hawker: { emoji: "🍜", gradient: "from-orange-400 to-red-500" },
  Chinese: { emoji: "🥢", gradient: "from-red-400 to-rose-600" },
  Peranakan: { emoji: "🍤", gradient: "from-amber-400 to-orange-600" },
  Japanese: { emoji: "🍣", gradient: "from-sky-400 to-indigo-500" },
  Malay: { emoji: "🍛", gradient: "from-emerald-400 to-teal-600" },
  Desserts: { emoji: "🍧", gradient: "from-pink-400 to-fuchsia-500" },
  Cafe: { emoji: "☕", gradient: "from-stone-400 to-amber-700" },
  Indian: { emoji: "🫓", gradient: "from-yellow-400 to-orange-500" },
  Western: { emoji: "🥩", gradient: "from-rose-400 to-red-700" },
};

const DEFAULT_STYLE = { emoji: "🍽️", gradient: "from-slate-400 to-slate-600" };

export function cuisineStyle(cuisineType: string) {
  return CUISINE_STYLES[cuisineType] ?? DEFAULT_STYLE;
}
