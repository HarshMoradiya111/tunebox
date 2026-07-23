import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Playlist, Track } from "../models";
import { getPlaylist } from "../services";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function attachStreamUrls(playlist: any) {
  if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return playlist;
  
  const trackSpotifyIds = playlist.tracks.map((t: any) => t.spotifyId);
  const readySongs = await mongoose.model("Song").find({
    spotifyTrackId: { $in: trackSpotifyIds },
    status: "ready"
  }).lean();

  const streamUrlMap = new Map(readySongs.map((s: any) => [s.spotifyTrackId, s.streamUrl]));

  return {
    ...playlist,
    tracks: playlist.tracks.map((t: any) => ({
      ...t,
      streamUrl: streamUrlMap.get(t.spotifyId) || t.streamUrl || undefined
    }))
  };
}

/**
 * GET /api/playlist/:spotifyId
 * Returns a playlist with its tracks, cache-first from MongoDB.
 */
export async function getPlaylistById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const spotifyId = req.params.spotifyId as string;

    // Check cache
    const cached = await Playlist.findOne({
      spotifyId,
      updatedAt: { $gte: new Date(Date.now() - CACHE_TTL_MS) },
    })
      .populate("tracks")
      .lean();

    if (cached && cached.tracks && cached.tracks.length > 0) {
      const playlistWithStreams = await attachStreamUrls(cached);
      res.json({ success: true, source: "cache", data: playlistWithStreams });
      return;
    }

    // Fetch from Spotify (NOTE: FLAG - Mismatch in service expectation)
    // The getPlaylist() function currently resolves to musicBrainzService.getPlaylist(), 
    // which expects a MusicBrainz release UUID, NOT a Spotify Playlist ID. 
    // If a cache miss occurs for an imported Spotify playlist, this will fail or throw.
    // We are deliberately leaving this as-is pending a decision on whether to 
    // re-trigger spotify-url-info scraping instead of MusicBrainz lookup.
    const spotifyPlaylist = await getPlaylist(spotifyId);

    // Upsert tracks
    const trackDocs = await Promise.all(
      spotifyPlaylist.tracks.items
        .filter((item: any) => item.track !== null)
        .map(async (item: any) => {
          const t = item.track!;
          return Track.findOneAndUpdate(
            { spotifyId: t.id },
            {
              spotifyId: t.id,
              title: t.name,
              artist: t.artists.map((a: any) => a.name).join(", "),
              album: t.album.name,
              albumArt: t.album.images?.[0]?.url || "",
              duration: t.duration_ms,
              trackNumber: t.track_number,
              previewUrl: t.preview_url || undefined,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).lean();
        })
    );

    // Upsert playlist with track references
    const savedPlaylist = await Playlist.findOneAndUpdate(
      { spotifyId },
      {
        spotifyId,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description || "",
        coverImage: spotifyPlaylist.images?.[0]?.url || "",
        owner: spotifyPlaylist.owner?.display_name || "",
        tracks: trackDocs.map((t) => t._id),
        totalTracks: spotifyPlaylist.tracks.total,
        isPublic: spotifyPlaylist.public ?? true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate("tracks")
      .lean();

    const playlistWithStreams = await attachStreamUrls(savedPlaylist);
    res.json({ success: true, source: "spotify", data: playlistWithStreams });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/playlist/:spotifyId/import-status
 * Returns the current import status and progress of a playlist.
 */
export async function getImportStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const spotifyId = req.params.spotifyId as string;
    
    const playlist = await Playlist.findOne({ spotifyId })
      .select("importStatus totalTracks tracks")
      .lean();

    if (!playlist) {
      res.status(404).json({ success: false, message: "Playlist not found" });
      return;
    }

    res.json({
      success: true,
      importStatus: playlist.importStatus,
      totalTracks: playlist.totalTracks,
      tracksImportedSoFar: playlist.tracks?.length || 0
    });
  } catch (error) {
    next(error);
  }
}
