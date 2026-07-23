import youtubedl from "youtube-dl-exec";
import path from "path";
import fs from "fs";
import config from "../config";
import { Song } from "../models";
// @ts-ignore
import ytSearch from "yt-search";

export async function downloadAudio(
  title: string,
  artist: string,
  spotifyTrackId: string,
  durationMs: number,
  album: string,
  albumArt: string
): Promise<any> {
  const searchQuery = `${title} ${artist} audio`;

  // 1. Create or get Song document
  let song = await Song.findOne({ spotifyTrackId });
  if (song && song.status === "ready" && song.streamUrl) {
    return song; // already downloaded
  }

  if (!song) {
    song = new Song({
      spotifyTrackId,
      title,
      artist,
      album,
      albumArt,
      duration: Math.round(durationMs / 1000), // Song uses seconds
      status: "downloading",
    });
    await song.save();
  } else {
    song.status = "downloading";
    await song.save();
  }

  try {
    // 2. Search youtube
    const searchResults = await ytSearch(searchQuery);
    if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
      throw new Error("No YouTube results found");
    }
    const videoUrl = searchResults.videos[0].url;

    // 3. Download via youtube-dl-exec
    const safeName = `${title}-${artist}`.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${safeName}-${spotifyTrackId}.m4a`;

    // Ensure library dir exists
    if (!fs.existsSync(config.libraryPath)) {
      fs.mkdirSync(config.libraryPath, { recursive: true });
    }

    const filePath = path.join(config.libraryPath, filename);

    // If file exists from previous failed run, delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const ytdlOptions: any = {
      // Use format selection instead of extractAudio to avoid ffmpeg dependency
      format: "bestaudio[ext=m4a]/bestaudio",
      output: filePath,
      noWarnings: true,
      addHeader: ["referer:youtube.com", "user-agent:Mozilla/5.0"],
    };

    if (config.youtubeProxy) {
      ytdlOptions.proxy = config.youtubeProxy;
    }

    await youtubedl(videoUrl, ytdlOptions);

    // 4. Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error("Download completed but file not found");
    }

    const stat = fs.statSync(filePath);

    // 5. Update Song document
    song.filePath = filePath;
    song.streamUrl = `${config.publicBaseUrl}/api/stream/${encodeURIComponent(filename)}`;
    song.fileSize = stat.size;
    song.format = "m4a";
    song.status = "ready";
    await song.save();

    return song;
  } catch (error: any) {
    console.error(`Download failed for ${title} using yt-dlp:`, error.message);
    
    // iTunes fallback for cloud environments (Render/Vercel) where YouTube blocks IPs
    try {
      const axios = require("axios");
      const itunesRes = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(title + " " + artist)}&entity=song&limit=1`);
      if (itunesRes.data.resultCount > 0 && itunesRes.data.results[0].previewUrl) {
        song.streamUrl = itunesRes.data.results[0].previewUrl;
        song.format = "stream";
        song.status = "ready";
        await song.save();
        return song;
      }
    } catch (itunesError: any) {
      console.error("iTunes fallback also failed:", itunesError.message);
    }

    song.status = "failed";
    song.errorMessage = error.message;
    await song.save();
    return null;
  }
}
