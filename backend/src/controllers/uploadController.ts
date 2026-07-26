import { Request, Response } from "express";
import { Song, Playlist } from "../models";
import { matchSongToMissingTracks } from "../services";
import { uploadAudioToCloudinary, uploadImageToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService";
import path from "path";
import fs from "fs";
import { normalizeArtist } from "../utils/normalizeArtist";
import { compressAudio } from "../services/audioCompressionService";

export const uploadTrack = async (req: Request, res: Response): Promise<any> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files["audio"] || !files["audio"][0]) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const file = files["audio"][0];
    const coverFile = files["coverArt"] ? files["coverArt"][0] : null;
    const metadata = req.body;

    let compressedAudioPath = "";

    const cleanupTempFiles = () => {
      if (file && file.path) fs.unlink(file.path, () => {});
      if (coverFile && coverFile.path) fs.unlink(coverFile.path, () => {});
      if (compressedAudioPath) fs.unlink(compressedAudioPath, () => {});
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

    const ext = path.extname(file.originalname).replace(".", "") || "mp3";
    const needsCloudCompression = file.size > 5 * 1024 * 1024;

    // Parallel upload audio & cover art directly to Cloudinary
    const [secureUrl, albumArtUrl] = await Promise.all([
      uploadAudioToCloudinary(file.path, uniqueId, needsCloudCompression),
      coverFile
        ? uploadImageToCloudinary(coverFile.path, coverUniqueId)
        : Promise.resolve(metadata.albumArt || ""),
    ]);

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
    await matchSongToMissingTracks(newSong);


    // Smart Auto-playlist assignment (e.g. Bollywood, Punjabi, Lofi, or Custom Name)
    let targetPlaylistName = metadata.playlist ? String(metadata.playlist).trim() : "";
    
    // Auto-detect playlist category if no explicit playlist name is set
    if (!targetPlaylistName) {
      const fullText = `${trackTitle} ${trackArtist} ${metadata.album || ''} ${file.originalname || ''}`.toLowerCase();
      if (fullText.includes("bollywood") || fullText.includes("hindi")) {
        targetPlaylistName = "Bollywood";
      } else if (fullText.includes("punjabi")) {
        targetPlaylistName = "Punjabi";
      } else if (fullText.includes("lofi") || fullText.includes("lo-fi")) {
        targetPlaylistName = "Lofi & Chill";
      } else if (fullText.includes("party") || fullText.includes("remix")) {
        targetPlaylistName = "Party Hits";
      } else {
        targetPlaylistName = "My Uploads"; // Store general songs in a single consolidated playlist instead of creating per-artist playlists
      }
    }

    // Find or atomically create target playlist to prevent duplicate playlists during parallel bulk uploads
    const safeSlug = targetPlaylistName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const defaultCover = albumArtUrl || "";

    let targetPlaylist = await Playlist.findOne({ 
      name: new RegExp(`^${targetPlaylistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
    });

    if (!targetPlaylist) {
      try {
        targetPlaylist = await Playlist.findOneAndUpdate(
          { name: targetPlaylistName },
          {
            $setOnInsert: {
              spotifyId: `auto-playlist-${safeSlug}-${Date.now()}`,
              name: targetPlaylistName,
              description: `All ${targetPlaylistName} uploaded tracks`,
              coverImage: defaultCover,
              owner: "TuneBox",
              tracks: [],
              totalTracks: 0,
              autoGenerated: true,
              isUserCreated: true,
            }
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        // If concurrent insert occurred, fetch existing
        targetPlaylist = await Playlist.findOne({ 
          name: new RegExp(`^${targetPlaylistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
        });
      }
    }

    if (targetPlaylist) {
      // Atomically add track to playlist if not already present
      const updatedPlaylist = await Playlist.findByIdAndUpdate(
        targetPlaylist._id,
        {
          $addToSet: { tracks: newSong._id }
        },
        { new: true }
      );
      if (updatedPlaylist) {
        updatedPlaylist.totalTracks = updatedPlaylist.tracks.length;
        if (!updatedPlaylist.coverImage && albumArtUrl) {
          updatedPlaylist.coverImage = albumArtUrl;
        }
        await updatedPlaylist.save();
      }
    }

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

    // Remove song from auto playlists
    await Playlist.updateMany(
      { tracks: song._id },
      { $pull: { tracks: song._id }, $inc: { totalTracks: -1 } }
    );

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
