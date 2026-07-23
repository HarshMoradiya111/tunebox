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
  importStatus?: "pending" | "importing" | "completed" | "failed";
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

export interface ApiSearchResult {
  id: string;
  title: string;
  artist: string;
  coverArtUrl: string;
}

/** Search music via backend /api/search */
export async function searchMusic(query: string): Promise<ApiSearchResult[]> {
  const res = await apiFetch<ApiResponse<ApiSearchResult[]>>(
    `/search?q=${encodeURIComponent(query)}`
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

/** Import a playlist from a Spotify URL */
export async function importPlaylistApi(url: string): Promise<ApiPlaylistDetail> {
  const res = await apiFetch<{ success: boolean; playlist: ApiPlaylistDetail }>("/playlist/import", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  if (!res.success) throw new Error("Failed to import playlist");
  return res.playlist;
}

// --- Phase 6: Fetch-on-miss song resolution ---

export interface ApiSong {
  _id: string;
  spotifyTrackId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  filePath: string;
  streamUrl: string;
  fileSize: number;
  format: string;
  status: "pending" | "downloading" | "ready" | "failed";
  errorMessage?: string;
}

export interface FetchSongResponse {
  success: boolean;
  source: "cache" | "in-progress" | "queued";
  data: ApiSong;
}

/** POST /api/fetch-song — trigger download or return cached */
export async function fetchSongApi(params: {
  title: string;
  artist: string;
  spotifyTrackId?: string;
  album?: string;
  albumArt?: string;
}): Promise<FetchSongResponse> {
  return apiFetch<FetchSongResponse>("/fetch-song", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** GET /api/fetch-song/status/:songId — poll download status */
export async function fetchSongStatusApi(
  songId: string
): Promise<{ success: boolean; data: ApiSong }> {
  return apiFetch<{ success: boolean; data: ApiSong }>(
    `/fetch-song/status/${songId}`
  );
}

/**
 * Resolve a track to a streamable URL.
 * Uses the new /api/stream endpoint (yt-stream) instead of yt-dlp
 */
export async function resolveTrackStream(params: {
  title: string;
  artist: string;
  spotifyTrackId?: string;
  album?: string;
  albumArt?: string;
}): Promise<{ streamUrl: string; duration: number } | null> {
  try {
    const res = await apiFetch<{ success: boolean; audioUrl: string }>("/stream", {
      method: "POST",
      body: JSON.stringify({
        title: params.title,
        artist: params.artist,
      }),
    });

    if (res.success && res.audioUrl) {
      return { streamUrl: res.audioUrl, duration: 0 }; // Duration loads natively in HTML audio
    }
    
    return null;
  } catch (error) {
    console.error("Failed to resolve stream:", error);
    return null;
  }
}
