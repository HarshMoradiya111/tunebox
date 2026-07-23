/** Represents a track from the Spotify API / our database */
export interface Track {
  _id?: string;
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  trackNumber: number;
  previewUrl?: string;
}

/** Represents a playlist from the Spotify API / our database */
export interface Playlist {
  _id?: string;
  spotifyId: string;
  name: string;
  description: string;
  coverImage: string;
  owner: string;
  tracks: Track[];
  totalTracks: number;
  isPublic: boolean;
}

/** Represents a downloaded song ready for streaming */
export interface Song {
  _id?: string;
  spotifyTrackId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  streamUrl: string;
  status: "pending" | "downloading" | "ready" | "failed";
}

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
