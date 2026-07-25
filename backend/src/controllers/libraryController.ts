import { Request, Response } from "express";
import Song from "../models/Song";
import Track from "../models/Track";

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
