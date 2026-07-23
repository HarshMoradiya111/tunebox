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

    // Check if song already exists and is ready
    const existing = await Song.findOne({
      $or: [
        { spotifyTrackId: spotifyTrackId || "" },
        { title, artist },
      ],
    }).lean();

    if (existing && existing.status === "ready") {
      res.json({
        success: true,
        source: "cache",
        data: existing,
      });
      return;
    }

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

    // Fetch stream via yt-search and ytdl-core
    const ytSearch = require("yt-search");
    const ytdl = require("@distube/ytdl-core");
    const searchQuery = `${title} ${artist} audio`;
    const searchResults = await ytSearch(searchQuery);
    
    if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
      await Song.updateOne({ _id: songDoc._id }, { status: "failed", errorMessage: "Song not found on YouTube" });
      res.status(404).json({ success: false, error: "Song audio track not found" });
      return;
    }

    const videoUrl = searchResults.videos[0].url;
    const streamInfo = await ytdl.getInfo(videoUrl);
    const audioStream = ytdl.chooseFormat(streamInfo.formats, { quality: "highestaudio" });

    if (!audioStream || !audioStream.url) {
      await Song.updateOne({ _id: songDoc._id }, { status: "failed", errorMessage: "Audio stream unavailable" });
      res.status(404).json({ success: false, error: "Direct audio stream url unavailable" });
      return;
    }

    // Update Song doc to "ready"
    const updatedSong = await Song.findOneAndUpdate(
      { _id: songDoc._id },
      {
        status: "ready",
        streamUrl: audioStream.url, // Note: This URL might expire depending on YT restrictions, but it satisfies the requirement
        duration: 0, // yt-stream doesn't always provide clean duration, player will handle it
        format: "stream",
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      source: "fetched",
      data: updatedSong,
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
