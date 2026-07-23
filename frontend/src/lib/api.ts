const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Generic fetch wrapper for the backend API
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `API request failed: ${response.statusText}`
    );
  }

  return response.json();
}

// --- Typed API Functions ---

export interface ApiFeaturedPlaylist {
  _id: string;
  spotifyId: string;
  name: string;
  description: string;
  coverImage: string;
  owner: string;
  totalTracks: number;
}

export interface ApiNewRelease {
  spotifyId: string;
  name: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  albumType: string;
  totalTracks: number;
}

export interface ApiCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ApiTrack {
  _id: string;
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  trackNumber: number;
  previewUrl?: string;
}

export interface ApiPlaylistDetail {
  _id: string;
  spotifyId: string;
  name: string;
  description: string;
  coverImage: string;
  owner: string;
  tracks: ApiTrack[];
  totalTracks: number;
}

export interface ApiResponse<T> {
  success: boolean;
  source?: string;
  data: T;
  error?: string;
}

/** Fetch featured playlists */
export async function fetchFeaturedPlaylists(): Promise<ApiFeaturedPlaylist[]> {
  const res = await apiFetch<ApiResponse<ApiFeaturedPlaylist[]>>(
    "/browse/featured"
  );
  return res.data;
}

/** Fetch new album releases */
export async function fetchNewReleases(): Promise<ApiNewRelease[]> {
  const res = await apiFetch<ApiResponse<ApiNewRelease[]>>(
    "/browse/new-releases"
  );
  return res.data;
}

/** Fetch browse categories */
export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await apiFetch<ApiResponse<ApiCategory[]>>(
    "/browse/categories"
  );
  return res.data;
}

/** Fetch a playlist with tracks by Spotify ID */
export async function fetchPlaylist(
  spotifyId: string
): Promise<ApiPlaylistDetail> {
  const res = await apiFetch<ApiResponse<ApiPlaylistDetail>>(
    `/playlist/${spotifyId}`
  );
  return res.data;
}
