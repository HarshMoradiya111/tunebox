import { Request, Response, NextFunction } from "express";
import { Playlist, Track } from "../models";
import {
  getFeaturedPlaylists,
  getNewReleases,
  getCategories,
} from "../services";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * GET /api/browse/featured
 * Returns featured playlists, cache-first from MongoDB.
 */
export async function featuredPlaylists(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check cache: playlists updated within the last hour
    const cached = await Playlist.find({
      updatedAt: { $gte: new Date(Date.now() - CACHE_TTL_MS) },
    })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    if (cached.length >= 4) {
      res.json({ success: true, source: "cache", data: cached });
      return;
    }

    // Fetch from Spotify
    const spotifyPlaylists = await getFeaturedPlaylists();

    // Upsert into MongoDB
    const saved = await Promise.all(
      spotifyPlaylists.map(async (sp: any) => {
        return Playlist.findOneAndUpdate(
          { spotifyId: sp.id },
          {
            spotifyId: sp.id,
            name: sp.name,
            description: sp.description || "",
            coverImage: sp.images?.[0]?.url || "",
            owner: sp.owner?.display_name || "",
            totalTracks: sp.tracks?.total || 0,
            isPublic: sp.public ?? true,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
      })
    );

    res.json({ success: true, source: "spotify", data: saved });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/browse/new-releases
 * Returns new album releases from Spotify.
 */
export async function newReleases(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const albums = await getNewReleases();

    const formatted = albums.map((album: any) => ({
      spotifyId: album.id,
      name: album.name,
      artist: album.artists.map((a: any) => a.name).join(", "),
      coverImage: album.images?.[0]?.url || "",
      releaseDate: album.release_date,
      albumType: album.album_type,
      totalTracks: album.total_tracks,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/browse/categories
 * Returns browse categories for the search page.
 */
export async function browseCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await getCategories();

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icons?.[0]?.url || "",
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}
