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
