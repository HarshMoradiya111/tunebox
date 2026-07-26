import { Request, Response, NextFunction } from "express";
import { Playlist } from "../models";
import {
  getFeaturedPlaylists,
  getNewReleases,
  getCategories,
} from "../services";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let newReleasesCache: { data: any[]; timestamp: number } | null = null;
let featuredCache: { data: any[]; timestamp: number } | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

/**
 * GET /api/browse/featured
 * Returns featured playlists, cache-first.
 */
export async function featuredPlaylists(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Check in-memory cache
    if (featuredCache && Date.now() - featuredCache.timestamp < CACHE_TTL_MS) {
      res.json({ success: true, source: "memory-cache", data: featuredCache.data });
      return;
    }

    // 2. Check MongoDB cache
    const cached = await Playlist.find()
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    if (cached.length >= 1) {
      featuredCache = { data: cached, timestamp: Date.now() };
      res.json({ success: true, source: "db-cache", data: cached });
      return;
    }

    // 3. Fetch from MusicBrainz with 1.5s timeout
    const spotifyPlaylists = await withTimeout(getFeaturedPlaylists(), 1500, []);

    if (!spotifyPlaylists || spotifyPlaylists.length === 0) {
      res.json({ success: true, source: "fallback", data: [] });
      return;
    }

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

    featuredCache = { data: saved, timestamp: Date.now() };
    res.json({ success: true, source: "musicbrainz", data: saved });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/browse/new-releases
 * Returns new album releases with in-memory cache and 1.5s timeout.
 */
export async function newReleases(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (newReleasesCache && Date.now() - newReleasesCache.timestamp < CACHE_TTL_MS) {
      res.json({ success: true, source: "memory-cache", data: newReleasesCache.data });
      return;
    }

    const albums = await withTimeout(getNewReleases(), 1500, []);

    const formatted = (albums || []).map((album: any) => ({
      spotifyId: album.id,
      name: album.name,
      artist: album.artists?.map((a: any) => a.name).join(", ") || "Unknown",
      coverImage: album.images?.[0]?.url || "",
      releaseDate: album.release_date || "",
      albumType: album.album_type || "album",
      totalTracks: album.total_tracks || 1,
    }));

    if (formatted.length > 0) {
      newReleasesCache = { data: formatted, timestamp: Date.now() };
    }

    res.json({ success: true, data: formatted.length > 0 ? formatted : (newReleasesCache?.data || []) });
  } catch (error) {
    console.error("Error in newReleases:", error);
    res.json({ success: true, data: newReleasesCache?.data || [] });
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
