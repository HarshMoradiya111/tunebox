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
  tags?: string[];
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
  tags?: string[];
}

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: "playlist" | "album" | "artist";
}

export interface Genre {
  id: string;
  name: string;
  color: string;
}

export interface TrackItem {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // seconds
  dateAdded?: string;
  streamUrl?: string;
  isLiked?: boolean;
  tags?: string[];
}
