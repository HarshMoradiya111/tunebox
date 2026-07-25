import { Request, Response } from "express";
import { Song } from "../models";
import { uploadAudioToCloudinary } from "../services/cloudinaryService";
import path from "path";
import fs from "fs";

export const uploadTrack = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const file = req.file;
    const metadata = req.body;

    // Validate MIME type
    if (!file.mimetype.startsWith("audio/")) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: "Invalid file type. Only audio files are allowed." });
    }

    // Validate file size (already done by multer, but good to be explicit here if needed)
    if (file.size > 20 * 1024 * 1024) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: "File exceeds 20MB limit." });
    }

    // Generate unique ID for SpotifyTrackId and Cloudinary Public ID
    const uniqueId = `local-${Date.now()}`;

    // Upload to Cloudinary
    const secureUrl = await uploadAudioToCloudinary(file.path, uniqueId);

    // Get format from file extension
    const ext = path.extname(file.originalname).replace(".", "") || "mp3";

    // Save to MongoDB as a Song
    const newSong = new Song({
      spotifyTrackId: uniqueId,
      title: metadata.title || "Unknown Title",
      artist: metadata.artist || "Unknown Artist",
      album: metadata.album || "Unknown Album",
      duration: metadata.duration ? parseInt(metadata.duration, 10) : 0,
      albumArt: metadata.albumArt || "",
      filePath: secureUrl,
      streamUrl: secureUrl,
      fileSize: file.size,
      format: ext,
      status: "ready",
      cloudinaryPublicId: uniqueId,
    });

    await newSong.save();

    // Clean up temporary file
    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    return res.status(201).json(newSong);
  } catch (error) {
    console.error("Error in uploadTrack:", error);
    
    // Clean up temp file on error too
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    return res.status(500).json({ error: "Failed to upload track" });
  }
};

import { deleteFromCloudinary } from "../services/cloudinaryService";

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
      // Fallback: Extract publicId from streamUrl if not explicitly saved
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
