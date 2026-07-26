import { Request, Response } from "express";
import { Playlist, Song } from "../models";
import { findMatchingLocalSong } from "../services";

const fetch = require("isomorphic-unfetch");
const { getDetails } = require("spotify-url-info")(fetch);

export const importPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes("spotify.com/playlist/")) {
      res.status(400).json({ success: false, message: "Invalid Spotify playlist URL provided." });
      return;
    }

    // Extract Spotify ID from URL
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const spotifyId = match ? match[1] : null;
    
    if (!spotifyId) {
      res.status(400).json({ success: false, message: "Could not find a playlist ID in that URL" });
      return;
    }

    // Check if playlist already exists
    let existingPlaylist = await Playlist.findOne({ spotifyId });
    if (existingPlaylist) {
      res.status(200).json({ 
        success: true, 
        playlist: existingPlaylist,
        message: "Playlist already imported." 
      });
      return;
    }

    // Fetch playlist details from Spotify metadata
    let details;
    try {
      details = await getDetails(url);
    } catch (scrapingErr: any) {
      console.error("spotify-url-info getDetails failed:", scrapingErr.message, scrapingErr.stack);
      res.status(502).json({ success: false, message: `Scraping failed: ${scrapingErr.message}` });
      return;
    }

    if (!details || !details.preview) {
      res.status(404).json({ success: false, message: "Could not fetch playlist details from Spotify." });
      return;
    }

    const { preview, tracks } = details;

    // Load all ready local songs for matching
    const localSongs = await Song.find({ status: "ready" }).lean();

    const matchedTrackIds: any[] = [];
    const missingTracks: any[] = [];

    if (Array.isArray(tracks)) {
      for (const t of tracks) {
        if (!t) continue;
        const title = t.name || t.title || "Unknown Title";
        const artist = t.artist || (t.artists ? t.artists.map((a: any) => a.name).join(", ") : "Unknown Artist");
        const durationMs = t.duration_ms || t.duration || 0;
        const trackSpotifyId = t.uri ? t.uri.replace("spotify:track:", "") : (t.id || `spotify-${Date.now()}-${Math.random()}`);

        const match = findMatchingLocalSong(title, artist, durationMs, localSongs as any[]);

        if (match) {
          // Verify we don't add duplicates to the playlist
          if (!matchedTrackIds.some(id => id.toString() === match._id.toString())) {
            matchedTrackIds.push(match._id);
          }
        } else {
          missingTracks.push({
            spotifyId: trackSpotifyId,
            title,
            artist,
            album: t.album?.name || t.album || "Unknown Album",
            duration: durationMs,
            addedAt: new Date()
          });
        }
      }
    }

    // Create new Playlist with matched songs and missing queue
    const newPlaylist = new Playlist({
      spotifyId,
      name: preview.title || "Imported Playlist",
      description: preview.description || "",
      coverImage: preview.image || "",
      owner: preview.owner || "Spotify Import",
      tracks: matchedTrackIds,
      missingTracks: missingTracks,
      totalTracks: matchedTrackIds.length + missingTracks.length,
      isPublic: true,
      importStatus: "completed",
      isUserCreated: true // Ensures playlistController loads full Song objects
    });

    await newPlaylist.save();

    res.status(200).json({
      success: true,
      playlist: newPlaylist,
      matchedCount: matchedTrackIds.length,
      missingCount: missingTracks.length,
      message: `Imported ${matchedTrackIds.length} songs from library. ${missingTracks.length} tracks added to missing queue.`
    });

  } catch (err: any) {
    console.error("Playlist import error:", err.message, err.stack);
    res.status(500).json({ success: false, message: err.message || "Failed to import playlist" });
  }
};
