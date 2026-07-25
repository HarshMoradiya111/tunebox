import { Request, Response } from "express";
import { Song, Track } from "../models";
import ArtistMetadata from "../models/ArtistMetadata";
import axios from "axios";

export const getArtists = async (req: Request, res: Response): Promise<any> => {
  try {
    const songArtists = await Song.aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$artist" } } },
          name: { $first: { $trim: { input: "$artist" } } },
          trackCount: { $sum: 1 },
          coverImage: { $first: "$albumArt" },
        },
      },
    ]);

    const trackArtists = await Track.aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$artist" } } },
          name: { $first: { $trim: { input: "$artist" } } },
          trackCount: { $sum: 1 },
          coverImage: { $first: "$albumArt" },
        },
      },
    ]);

    // Merge the results
    const artistMap = new Map<string, { name: string; trackCount: number; coverImage: string }>();

    for (const artist of [...songArtists, ...trackArtists]) {
      // Skip empty artists
      if (!artist.name) continue;
      
      const existing = artistMap.get(artist._id);
      if (existing) {
        existing.trackCount += artist.trackCount;
        if (!existing.coverImage && artist.coverImage) {
          existing.coverImage = artist.coverImage;
        }
      } else {
        artistMap.set(artist._id, {
          name: artist.name,
          trackCount: artist.trackCount,
          coverImage: artist.coverImage || "",
        });
      }
    }

    const mergedArtists = Array.from(artistMap.values()).sort((a, b) => b.trackCount - a.trackCount);

    // Fetch images for artists from DB or Deezer
    const artistNames = mergedArtists.map((a) => a.name);
    const existingMetadata = await ArtistMetadata.find({ name: { $in: artistNames } });
    
    // Create map for O(1) lookups
    const metaMap = new Map(existingMetadata.map((m) => [m.name, m.image]));
    
    // Process artists sequentially to avoid Deezer API rate limits
    for (const artist of mergedArtists) {
      if (metaMap.has(artist.name)) {
        const cachedImg = metaMap.get(artist.name);
        if (cachedImg) artist.coverImage = cachedImg;
      } else {
        // Fetch from Deezer API
        try {
          const dzRes = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artist.name)}&limit=1`);
          const dzImg = dzRes.data?.data?.[0]?.picture_xl || dzRes.data?.data?.[0]?.picture_medium;
          
          if (dzImg) {
            artist.coverImage = dzImg;
          }
          // Save to DB so we don't query again
          await ArtistMetadata.create({ name: artist.name, image: dzImg || "" });
        } catch (dzErr) {
          console.error(`Failed to fetch Deezer image for ${artist.name}:`, (dzErr as Error).message);
          await ArtistMetadata.create({ name: artist.name, image: "" }).catch(() => {});
        }
      }
    }

    return res.status(200).json(mergedArtists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    return res.status(500).json({ error: "Failed to fetch artists" });
  }
};

export const getArtistTracks = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: "Artist name is required" });

    const nameStr = String(name);
    const regex = new RegExp(`^${nameStr.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i');

    const songs = await Song.find({ artist: regex }).sort({ album: 1, createdAt: 1 }).lean();
    const tracks = await Track.find({ artist: regex }).sort({ album: 1, trackNumber: 1, createdAt: 1 }).lean();

    const allTracks = [...songs, ...tracks].sort((a: any, b: any) => {
      // Sort by album first
      const albumA = a.album || "";
      const albumB = b.album || "";
      if (albumA !== albumB) return albumA.localeCompare(albumB);
      
      // Then track number if available
      if (a.trackNumber && b.trackNumber) return a.trackNumber - b.trackNumber;
      
      // Then date added
      const dateA = a.createdAt || a.uploadedAt || 0;
      const dateB = b.createdAt || b.uploadedAt || 0;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return res.status(200).json(allTracks);
  } catch (error) {
    console.error("Error fetching artist tracks:", error);
    return res.status(500).json({ error: "Failed to fetch artist tracks" });
  }
};
