import { spotifyFetch } from "./spotifyAuth";

// --- Spotify API Response Types ---

interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
}

interface SpotifyTrackItem {
  track: {
    id: string;
    name: string;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    duration_ms: number;
    track_number: number;
    preview_url: string | null;
  } | null;
  added_at: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: { display_name: string };
  tracks: {
    total: number;
    items: SpotifyTrackItem[];
    next: string | null;
  };
  public: boolean;
}

interface SpotifyFeaturedResponse {
  message: string;
  playlists: {
    items: SpotifyPlaylist[];
  };
}

interface SpotifyNewReleasesResponse {
  albums: {
    items: Array<{
      id: string;
      name: string;
      artists: SpotifyArtist[];
      images: SpotifyImage[];
      release_date: string;
      album_type: string;
      total_tracks: number;
    }>;
  };
}

interface SpotifyCategoryItem {
  id: string;
  name: string;
  icons: SpotifyImage[];
}

interface SpotifyCategoriesResponse {
  categories: {
    items: SpotifyCategoryItem[];
  };
}

// --- Curated fallback playlist IDs ---
// Some browse endpoints may be restricted for newer Spotify apps.
// These are well-known public playlists to use as fallbacks.
const FALLBACK_PLAYLIST_IDS = [
  "37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits
  "37i9dQZF1DX0XUsuxWHRQd", // RapCaviar
  "37i9dQZF1DWXRqgorJj26U", // Rock Classics
  "37i9dQZF1DX4sWSpwq3LiO", // Peaceful Piano
  "37i9dQZF1DX1lVhptIYRda", // Hot Hits India
  "37i9dQZF1DX4dyzvuaRJ0n", // mint
];

// --- API Functions ---

/**
 * Fetch featured playlists from Spotify.
 * Falls back to fetching curated playlist IDs individually if the browse endpoint is restricted.
 */
export async function getFeaturedPlaylists(): Promise<SpotifyPlaylist[]> {
  try {
    const data = await spotifyFetch<SpotifyFeaturedResponse>(
      "/browse/featured-playlists?limit=12&country=IN"
    );
    return data.playlists.items;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      "⚠️ Featured playlists endpoint failed, using fallback IDs:",
      errMsg
    );

    // Fallback: fetch each curated playlist individually
    const results = await Promise.allSettled(
      FALLBACK_PLAYLIST_IDS.map((id) =>
        spotifyFetch<SpotifyPlaylist>(`/playlists/${id}?fields=id,name,description,images,owner(display_name),tracks(total),public`)
      )
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<SpotifyPlaylist> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value);
  }
}

/**
 * Fetch a single playlist with its full track list.
 */
export async function getPlaylist(
  spotifyId: string
): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(
    `/playlists/${spotifyId}?fields=id,name,description,images,owner(display_name),public,tracks(total,items(added_at,track(id,name,artists,album(id,name,images),duration_ms,track_number,preview_url)),next)`
  );
}

/**
 * Fetch new album releases.
 */
export async function getNewReleases(): Promise<
  SpotifyNewReleasesResponse["albums"]["items"]
> {
  const data = await spotifyFetch<SpotifyNewReleasesResponse>(
    "/browse/new-releases?limit=10&country=IN"
  );
  return data.albums.items;
}

/**
 * Fetch browse categories for the search page.
 */
export async function getCategories(): Promise<SpotifyCategoryItem[]> {
  const data = await spotifyFetch<SpotifyCategoriesResponse>(
    "/browse/categories?limit=20&country=IN&locale=en_IN"
  );
  return data.categories.items;
}

export type {
  SpotifyPlaylist,
  SpotifyTrackItem,
  SpotifyImage,
  SpotifyArtist,
  SpotifyAlbum,
  SpotifyCategoryItem,
};
