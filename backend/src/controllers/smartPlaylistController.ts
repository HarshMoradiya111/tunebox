import { Request, Response } from "express";
import Song from "../models/Song";

export const getMostPlayed = async (req: Request, res: Response): Promise<any> => {
  try {
    const songs = await Song.find().sort({ playCount: -1 }).limit(20);
    res.json({ success: true, data: songs });
  } catch (error) {
    console.error("Get most played error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch most played" });
  }
};

export const getRecentlyAdded = async (req: Request, res: Response): Promise<any> => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: songs });
  } catch (error) {
    console.error("Get recently added error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recently added" });
  }
};
