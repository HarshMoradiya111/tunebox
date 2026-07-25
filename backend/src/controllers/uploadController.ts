import { Request, Response } from "express";
import { Song } from "../models";
import { uploadAudioToCloudinary, uploadImageToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService";
import path from "path";
import fs from "fs";
import { normalizeArtist } from "../utils/normalizeArtist";

export const uploadTrack = async (req: Request, res: Response): Promise<any> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files["audio"] || !files["audio"][0]) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const file = files["audio"][0];
    const coverFile = files["coverArt"] ? files["coverArt"][0] : null;
    const metadata = req.body;

    const cleanupTempFiles = () => {
      if (file && file.path) fs.unlink(file.path, () => {});
      if (coverFile && coverFile.path) fs.unlink(coverFile.path, () => {});
    };

    // Validate MIME type
    if (!file.mimetype.startsWith("audio/")) {
      cleanupTempFiles();
      return res.status(400).json({ error: "Invalid file type. Only audio files are allowed." });
    }

    // Validate file size
    if (file.size > 20 * 1024 * 1024) {
      cleanupTempFiles();
      return res.status(400).json({ error: "File exceeds 20MB limit." });
    }

    const trackTitle = metadata.title ? String(metadata.title).trim() : "Unknown Title";
    const trackArtist = normalizeArtist(metadata.artist);

    // Duplicate detection
    if (metadata.force !== "true") {
      const existingSong = await Song.findOne({
        title: new RegExp(`^${trackTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        artist: new RegExp(`^${trackArtist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });

      if (existingSong) {
        cleanupTempFiles();
        return res.status(409).json({
          error: "Duplicate track found",
          existingSong,
        });
      }
    }

    // Generate unique IDs
    const uniqueId = `local-${Date.now()}`;
    const coverUniqueId = `cover-${Date.now()}`;

    // Upload to Cloudinary
    const secureUrl = await uploadAudioToCloudinary(file.path, uniqueId);
    let albumArtUrl = metadata.albumArt || "";

    if (coverFile) {
      albumArtUrl = await uploadImageToCloudinary(coverFile.path, coverUniqueId);
    }

    // Get format from file extension
    const ext = path.extname(file.originalname).replace(".", "") || "mp3";

    // Save to MongoDB
    const newSong = new Song({
      spotifyTrackId: uniqueId,
      title: trackTitle,
      artist: trackArtist,
      album: metadata.album || "Unknown Album",
      duration: metadata.duration ? parseInt(metadata.duration, 10) : 0,
      albumArt: albumArtUrl,
      filePath: secureUrl,
      streamUrl: secureUrl,
      fileSize: file.size,
      format: ext,
      status: "ready",
      cloudinaryPublicId: uniqueId,
    });

    await newSong.save();
    cleanupTempFiles();

    return res.status(201).json(newSong);
  } catch (error) {
    console.error("Error in uploadTrack:", error);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files["audio"]) fs.unlink(files["audio"][0].path, () => {});
    if (files && files["coverArt"]) fs.unlink(files["coverArt"][0].path, () => {});

    return res.status(500).json({ error: "Failed to upload track" });
  }
};

export const deleteUploadedSong = async (req: Request, res: Response): Promise<any> => {
  try {
    const { songId } = req.params;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (!song.spotifyTrackId.startsWith("local-")) {
      return res.status(403).json({ error: "Cannot delete non-local tracks via this endpoint" });
    }

    if (song.cloudinaryPublicId) {
      await deleteFromCloudinary(song.cloudinaryPublicId);
    } else {
      const urlParts = song.streamUrl.split("/");
      const filename = urlParts[urlParts.length - 1];
      const publicId = `tunebox-uploads/${filename.split(".")[0]}`;
      await deleteFromCloudinary(publicId);
    }

    await song.deleteOne();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting uploaded track:", error);
    return res.status(500).json({ error: "Failed to delete track" });
  }
};

export const editUploadedSong = async (req: Request, res: Response): Promise<any> => {
  try {
    const { songId } = req.params;
    const { title, artist, album } = req.body;

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ error: "Song not found" });

    if (!song.spotifyTrackId.startsWith("local-")) {
      return res.status(403).json({ error: "Cannot edit non-local tracks via this endpoint" });
    }

    if (title) song.title = String(title).trim();
    if (artist) song.artist = normalizeArtist(artist);
    if (album) song.album = String(album).trim();

    await song.save();
    return res.status(200).json(song);
  } catch (error) {
    console.error("Error editing uploaded track:", error);
    return res.status(500).json({ error: "Failed to edit track" });
  }
};

export const getUploadedSongs = async (req: Request, res: Response): Promise<any> => {
  try {
    const songs = await Song.find({ spotifyTrackId: { $regex: "^local-" } }).sort({ createdAt: -1 });
    return res.status(200).json(songs);
  } catch (error) {
    console.error("Error fetching uploaded songs:", error);
    return res.status(500).json({ error: "Failed to fetch uploaded tracks" });
  }
};
