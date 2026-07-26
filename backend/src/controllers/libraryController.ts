import { Request, Response } from "express";
import Song from "../models/Song";
import Track from "../models/Track";
import Playlist from "../models/Playlist";
import PlayHistory from "../models/PlayHistory";

export const exportLibrary = async (req: Request, res: Response): Promise<any> => {
  try {
    const songs = await Song.find({}, {
      _id: 0,
      title: 1,
      artist: 1,
      album: 1,
      streamUrl: 1,
      tags: 1,
      isLiked: 1,
      playCount: 1,
      spotifyTrackId: 1
    }).lean();

    const tracks = await Track.find({}, {
      _id: 0,
      title: 1,
      artist: 1,
      album: 1,
      streamUrl: 1,
      tags: 1,
      spotifyId: 1
    }).lean();

    const exportData = {
      exportedAt: new Date().toISOString(),
      songs,
      tracks
    };

    res.setHeader("Content-Disposition", "attachment; filename=tunebox-library-export.json");
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error("Export library error:", error);
    res.status(500).json({ success: false, message: "Failed to export library" });
  }
};

export const getLikedCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await Song.countDocuments({ isLiked: true });
    res.json({ success: true, count });
  } catch (error) {
    console.error("Liked count error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch liked count" });
  }
};

export const getQuickAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const likedCount = await Song.countDocuments({ isLiked: true });
    const quickAccess: any[] = [];

    quickAccess.push({
      id: "liked-songs",
      title: "Liked Songs",
      subtitle: `${likedCount} songs`,
      image: "https://misc.scdn.co/liked-songs/liked-songs-640.png",
      type: "playlist",
    });

    const recentHistory = await PlayHistory.find()
      .sort({ playedAt: -1 })
      .limit(20)
      .populate("songId")
      .lean();
    
    const uniqueAlbums: any[] = [];
    const seenAlbums = new Set<string>();
    for (const record of recentHistory) {
      const song = record.songId as any;
      if (song && song.album && !seenAlbums.has(song.album)) {
        seenAlbums.add(song.album);
        uniqueAlbums.push(song);
      }
      if (uniqueAlbums.length === 2) break;
    }

    if (uniqueAlbums.length < 2) {
      const moreSongs = await Song.find({ spotifyTrackId: /^local-/ })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      for (const song of moreSongs) {
        if (song.album && !seenAlbums.has(song.album)) {
          seenAlbums.add(song.album);
          uniqueAlbums.push(song);
        }
        if (uniqueAlbums.length === 2) break;
      }
    }

    for (const song of uniqueAlbums) {
      quickAccess.push({
        id: song.album,
        title: song.album,
        subtitle: song.artist,
        image: song.albumArt || "https://placehold.co/300x300/222/FFF?text=Album",
        type: "album",
      });
    }

    // Removed imported playlists from quick access as requested

    res.json({ success: true, data: quickAccess });
  } catch (error) {
    console.error("Quick access error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quick access" });
  }
};

export const getLocalAlbums = async (req: Request, res: Response): Promise<void> => {
  try {
    const albums = await Song.aggregate([
      { $match: { spotifyTrackId: /^local-/ } },
      { 
        $group: { 
          _id: "$album",
          artist: { $first: "$artist" },
          coverImage: { $first: "$albumArt" },
          trackCount: { $sum: 1 },
          latestAdded: { $max: "$createdAt" }
        }
      },
      { $sort: { latestAdded: -1 } }
    ]);
    
    const formatted = albums.map(a => ({
      name: a._id,
      artist: a.artist,
      coverImage: a.coverImage,
      trackCount: a.trackCount
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Local albums error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch albums" });
  }
};

export const getLocalAlbumTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { albumName } = req.params;
    const tracks = await Song.find({ album: albumName, spotifyTrackId: /^local-/ })
      .sort({ trackNumber: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: tracks });
  } catch (error) {
    console.error("Local album tracks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch album tracks" });
  }
};

export const getMissingTracksQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const playlists = await Playlist.find({ "missingTracks.0": { $exists: true } }, { name: 1, _id: 1, missingTracks: 1 }).lean();
    
    const queue: any[] = [];
    for (const p of playlists) {
      if (p.missingTracks && Array.isArray(p.missingTracks)) {
        for (const mt of p.missingTracks) {
          queue.push({
            ...mt,
            playlistId: p._id,
            playlistName: p.name
          });
        }
      }
    }

    queue.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());

    res.json({ success: true, data: queue, count: queue.length });
  } catch (error) {
    console.error("Missing tracks queue error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch missing tracks queue" });
  }
};

export const removeMissingTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId, spotifyId } = req.params;
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      res.status(404).json({ success: false, message: "Playlist not found" });
      return;
    }
    if (playlist.missingTracks) {
      playlist.missingTracks = playlist.missingTracks.filter((mt: any) => mt.spotifyId !== spotifyId);
      playlist.totalTracks = playlist.tracks.length + playlist.missingTracks.length;
      await playlist.save();
    }
    res.json({ success: true, message: "Removed track from missing queue" });
  } catch (error) {
    console.error("Remove missing track error:", error);
    res.status(500).json({ success: false, message: "Failed to remove missing track" });
  }
};
