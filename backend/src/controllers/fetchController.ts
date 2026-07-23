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

    // Fetch stream via yt-search and ytdl-core
    const ytSearch = require("yt-search");
    const ytdl = require("@distube/ytdl-core");
    const axios = require("axios");
    const searchQuery = `${title} ${artist} lyrics audio`;
    
    let finalStreamUrl = null;

    try {
      const searchResults = await ytSearch(searchQuery);
      if (searchResults && searchResults.videos && searchResults.videos.length > 0) {
        const videoUrl = searchResults.videos[0].url;
        const streamInfo = await ytdl.getInfo(videoUrl);
        const audioStream = ytdl.chooseFormat(streamInfo.formats, { quality: "highestaudio" });
        if (audioStream && audioStream.url) {
          finalStreamUrl = audioStream.url;
        }
      }
    } catch (ytError) {
      console.warn("YouTube extraction failed in fetchController. Falling back to iTunes preview...");
    }

    // Fallback to iTunes API if YouTube fails
    if (!finalStreamUrl) {
      try {
        const itunesRes = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(title + " " + artist)}&entity=song&limit=1`);
        if (itunesRes.data.resultCount > 0 && itunesRes.data.results[0].previewUrl) {
          finalStreamUrl = itunesRes.data.results[0].previewUrl;
        }
      } catch (itunesError) {
        console.error("iTunes fallback failed:", itunesError);
      }
    }

    if (!finalStreamUrl) {
      await Song.updateOne({ _id: songDoc._id }, { status: "failed", errorMessage: "Audio stream unavailable" });
      res.status(404).json({ success: false, error: "Song audio track not found" });
      return;
    }

    // Update Song doc to "ready" but do NOT save the streamUrl
    // (YouTube URLs expire in 6h, and iTunes fallbacks are 30s clips that shouldn't permanently poison the DB)
    const updatedSong = await Song.findOneAndUpdate(
      { _id: songDoc._id },
      {
        status: "ready",
        duration: 0, 
        format: "stream",
      },
      { new: true }
    );

    if (!updatedSong) {
      res.status(404).json({ success: false, error: "Song document not found after creation" });
      return;
    }

    res.status(200).json({
      success: true,
      source: "fetched",
      data: {
        ...updatedSong.toObject(),
        streamUrl: finalStreamUrl // Attach the streamUrl only to the current response
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
