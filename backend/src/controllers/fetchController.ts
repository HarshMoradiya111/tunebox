import { Request, Response, NextFunction } from "express";
import { Song } from "../models";
import { searchAndDownload, getAudioDuration } from "../services/ytdlpService";
import config from "../config";

/**
 * POST /api/fetch-song
 * Accepts { title, artist, spotifyTrackId } and kicks off an async download.
 * Returns immediately with the Song document (status: "pending" or "ready").
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

    // If already downloading, return the existing doc
    if (existing && (existing.status === "pending" || existing.status === "downloading")) {
      res.json({
        success: true,
        source: "in-progress",
        data: existing,
      });
      return;
    }

    // Create a new Song doc with "pending" status
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

    // Return immediately — download happens in background
    res.status(202).json({
      success: true,
      source: "queued",
      data: songDoc,
    });

    // ---- Background async download ----
    (async () => {
      try {
        // Update status to "downloading"
        await Song.updateOne(
          { _id: songDoc._id },
          { status: "downloading" }
        );

        // Download the song
        const result = await searchAndDownload(title, artist);

        // Get audio duration
        let duration = 0;
        try {
          duration = await getAudioDuration(result.filePath);
        } catch (e) {
          console.warn("⚠️ Could not extract audio duration:", e);
        }

        // Build stream URL
        const streamUrl = `/api/stream/${encodeURIComponent(result.filename)}`;

        // Update Song doc to "ready"
        await Song.updateOne(
          { _id: songDoc._id },
          {
            status: "ready",
            filePath: result.filePath,
            streamUrl,
            fileSize: result.fileSize,
            duration,
            format: "mp3",
          }
        );

        console.log(`✅ Song ready: "${title}" by ${artist}`);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Download failed for "${title}":`, errMsg);

        await Song.updateOne(
          { _id: songDoc._id },
          { status: "failed", errorMessage: errMsg }
        );
      }
    })();
  } catch (error) {
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
