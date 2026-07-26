import { Request, Response } from "express";
import Song from "../models/Song";
import PlayHistory from "../models/PlayHistory";

// Toggle Like Status
export const toggleLike = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }
    
    song.isLiked = !song.isLiked;
    await song.save();
    
    res.json({ success: true, data: song });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

// Get Liked Tracks
export const getLikedTracks = async (req: Request, res: Response): Promise<any> => {
  try {
    const songs = await Song.find({ isLiked: true }).sort({ updatedAt: -1 });
    res.json({ success: true, data: songs });
  } catch (error) {
    console.error("Get liked tracks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch liked tracks" });
  }
};

// Record Play
export const recordPlay = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }
    
    // Increment play count
    song.playCount = (song.playCount || 0) + 1;
    await song.save();
    
    // Record history
    await PlayHistory.create({ songId: song._id });
    
    res.json({ success: true, message: "Play recorded" });
  } catch (error) {
    console.error("Record play error:", error);
    res.status(500).json({ success: false, message: "Failed to record play" });
  }
};

// Get Recently Played
export const getRecentlyPlayed = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get unique recently played songs using aggregation
    const recentPlays = await PlayHistory.aggregate([
      { $sort: { playedAt: -1 } },
      {
        $group: {
          _id: "$songId",
          playedAt: { $first: "$playedAt" }
        }
      },
      { $sort: { playedAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "songs",
          localField: "_id",
          foreignField: "_id",
          as: "song"
        }
      },
      { $unwind: "$song" }
    ]);
    
    const formattedTracks = recentPlays.map(play => play.song);
    res.json({ success: true, data: formattedTracks });
  } catch (error) {
    console.error("Get recently played error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recently played" });
  }
};

// Search Local Library
export const searchLocalLibrary = async (req: Request, res: Response): Promise<any> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    // Search by title or artist using regex (case-insensitive)
    const regex = new RegExp(query, "i");
    const songs = await Song.find({
      $or: [
        { title: { $regex: regex } },
        { artist: { $regex: regex } }
      ]
    }).limit(20);

    res.json({ success: true, data: songs });
  } catch (error) {
    console.error("Search local library error:", error);
    res.status(500).json({ success: false, message: "Failed to search library" });
  }
};

// Update Tags
export const updateTags = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    
    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: "Tags must be an array of strings" });
    }

    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    song.tags = tags;
    await song.save();

    res.json({ success: true, data: song });
  } catch (error) {
    console.error("Update tags error:", error);
    res.status(500).json({ success: false, message: "Failed to update tags" });
  }
};

// Batch Delete
export const batchDelete = async (req: Request, res: Response): Promise<any> => {
  try {
    const { songIds } = req.body;
    if (!Array.isArray(songIds)) {
      return res.status(400).json({ success: false, message: "songIds must be an array" });
    }

    // Need deleteFromCloudinary from cloudinaryService
    const { deleteFromCloudinary } = await import("../services/cloudinaryService");

    const songs = await Song.find({ _id: { $in: songIds } });
    
    let deletedCount = 0;
    for (const song of songs) {
      // Only delete local uploads
      if (song.spotifyTrackId.startsWith("local-")) {
        if (song.cloudinaryPublicId) {
          await deleteFromCloudinary(song.cloudinaryPublicId);
        }
        await Song.findByIdAndDelete(song._id);
        deletedCount++;
      }
    }

    res.json({ success: true, message: `Deleted ${deletedCount} tracks` });
  } catch (error) {
    console.error("Batch delete error:", error);
    res.status(500).json({ success: false, message: "Failed to batch delete tracks" });
  }
};

// Batch Tags
export const batchTags = async (req: Request, res: Response): Promise<any> => {
  try {
    const { songIds, tags } = req.body;
    if (!Array.isArray(songIds) || !Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: "songIds and tags must be arrays" });
    }

    await Song.updateMany(
      { _id: { $in: songIds } },
      { $addToSet: { tags: { $each: tags } } } // $addToSet prevents duplicates
    );

    res.json({ success: true, message: `Added tags to ${songIds.length} tracks` });
  } catch (error) {
    console.error("Batch tags error:", error);
    res.status(500).json({ success: false, message: "Failed to batch tag tracks" });
  }
};

// Get Recommendations (Song Radio)
export const getRecommendations = async (req: Request, res: Response): Promise<any> => {
  try {
    const { artist, trackId } = req.query;
    let query: any = {};
    
    if (artist) {
      query.artist = new RegExp(String(artist).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
    }
    if (trackId) {
      query._id = { $ne: trackId };
    }

    let recommended = await Song.find(query).limit(5);

    // Fill with extra popular tracks if needed
    if (recommended.length < 5) {
      const existingIds = recommended.map(r => r._id);
      if (trackId) existingIds.push(trackId as any);
      
      const extra = await Song.find({ _id: { $nin: existingIds } }).limit(5 - recommended.length);
      recommended = [...recommended, ...extra];
    }

    res.json({ success: true, data: recommended });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
  }
};
