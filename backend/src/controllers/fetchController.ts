import { Request, Response, NextFunction } from "express";
import { Song } from "../models";
import config from "../config";

/**
 * POST /api/fetch-song
 * Accepts { title, artist, spotifyTrackId } and fetches the stream via yt-stream.
 * Returns immediately with the Song document (status: "ready").
 */
export async function fetchSong(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, artist, spotifyTrackId } = req.body;

    if (!title || !artist) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: title, artist",
      });
      return;
    }

    // Check if song already exists
    const existing = await Song.findOne({
      $or: [
        { spotifyTrackId: spotifyTrackId || "" },
        { title, artist },
      ],
    }).lean();

    // Create a new Song doc with "pending" status initially
    const songDoc = await Song.findOneAndUpdate(
      { spotifyTrackId: spotifyTrackId || `${title}-${artist}` },
      {
        spotifyTrackId: spotifyTrackId || `${title}-${artist}`,
        title,
        artist,
        album: req.body.album || "",
        albumArt: req.body.albumArt || "",
        status: "pending",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Use the reliable downloadService with yt-dlp instead of ytdl-core
    const { downloadAudio } = require("../services/downloadService");
    const newSong = await downloadAudio(
      title,
      artist,
      spotifyTrackId || `${title}-${artist}`,
      0, // durationMs
      req.body.album || "",
      req.body.albumArt || ""
    );

    if (!newSong || !newSong.streamUrl) {
      await Song.updateOne({ _id: songDoc._id }, { status: "failed", errorMessage: "Audio stream unavailable" });
      res.status(404).json({ success: false, error: "Song audio track not found" });
      return;
    }

    const updatedSong = await Song.findById(newSong._id);

    if (!updatedSong) {
      res.status(404).json({ success: false, error: "Song document not found after creation" });
      return;
    }

    res.status(200).json({
      success: true,
      source: "fetched",
      data: {
        ...updatedSong.toObject(),
        streamUrl: updatedSong.streamUrl
      },
    });
  } catch (error: any) {
    console.error("FetchSong error:", error.message);
    next(error);
  }
}

/**
 * GET /api/fetch-song/status/:songId
 * Poll endpoint to check download progress.
 */
export async function fetchSongStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const songId = req.params.songId as string;

    const song = await Song.findById(songId).lean();

    if (!song) {
      res.status(404).json({
        success: false,
        error: "Song not found",
      });
      return;
    }

    res.json({
      success: true,
      data: song,
    });
  } catch (error) {
    next(error);
  }
}
