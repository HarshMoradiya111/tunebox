import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Playlist, Track } from "../models";
import { getPlaylist } from "../services";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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
      res.json({ success: true, source: "cache", data: cached });
      return;
    }

    // Fetch from Spotify
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

    // --------------------------------------------------------
    // PHASE 7: Pre-built Playlists - Attach stream URLs from Songs
    // --------------------------------------------------------
    let playlistToReturn = savedPlaylist || cached;
    
    if (playlistToReturn && playlistToReturn.tracks && playlistToReturn.tracks.length > 0) {
      // Find all ready songs for these tracks
      const trackSpotifyIds = playlistToReturn.tracks.map((t: any) => t.spotifyId);
      const readySongs = await mongoose.model("Song").find({
        spotifyTrackId: { $in: trackSpotifyIds },
        status: "ready"
      }).lean();

      // Create a map of spotifyTrackId -> streamUrl
      const streamUrlMap = new Map(readySongs.map((s: any) => [s.spotifyTrackId, s.streamUrl]));

      // Attach streamUrl to each track
      playlistToReturn = {
        ...playlistToReturn,
        tracks: playlistToReturn.tracks.map((t: any) => ({
          ...t,
          streamUrl: streamUrlMap.get(t.spotifyId) || undefined
        }))
      };
    }

    res.json({ success: true, source: cached ? "cache" : "spotify", data: playlistToReturn });
  } catch (error) {
    next(error);
  }
}
