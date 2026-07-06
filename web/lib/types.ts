export interface FoodEntry {
  id: string;
  restaurantName: string;
  dishName: string;
  address: string;
  postalCode: string | null;
  lat: number;
  lng: number;
  cuisineType: string;
  reviewerId: string;
  sourceType: "blog" | "video";
  note: string | null;
  reviewUrl: string;
  dateReviewed: string | null;
  googlePlaceId: string | null;
  photoUrl?: string | null;
  photoAttribution?: string | null;
}

export interface Reviewer {
  id: string;
  name: string;
  type: "blog" | "video";
  site: string | null;
  youtubeChannel?: string | null;
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

export type SortMode = "distance" | "recent";
export type ViewMode = "list" | "map";
