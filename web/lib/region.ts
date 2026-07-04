export type Region = "North" | "North-East" | "East" | "West" | "Central";

export const REGIONS: Region[] = ["North", "North-East", "East", "West", "Central"];

// Approximate Singapore region from coordinates, loosely following URA's five
// regions but leaning colloquial (e.g. Katong/Joo Chiat count as "East").
// Heuristic boundaries — good enough for a filter, not for town planning.
export function regionOf(lat: number, lng: number): Region {
  if (lng >= 103.93) return "East"; // Bedok, Tampines, Pasir Ris, Changi
  if (lat >= 1.38 && lng >= 103.76 && lng < 103.86) return "North"; // Woodlands, Sembawang, Yishun
  if (lat >= 1.35 && lng >= 103.83) return "North-East"; // AMK, Hougang, Sengkang, Punggol
  if (lng < 103.78) return "West"; // Jurong, Boon Lay, Clementi, CCK
  if (lng >= 103.885 && lat < 1.34) return "East"; // Katong, Joo Chiat, Marine Parade
  return "Central";
}
