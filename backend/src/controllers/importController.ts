import { Request, Response } from "express";
import { Playlist, Track } from "../models";
import { downloadAudio } from "../services";

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
    const urlParts = url.split("/");
    const playlistIdPart = urlParts[urlParts.length - 1];
    const spotifyId = playlistIdPart.split("?")[0];

    // Check if playlist already exists
    let existingPlaylist = await Playlist.findOne({ spotifyId }).populate("tracks");
    if (existingPlaylist) {
      res.status(200).json({ success: true, playlist: existingPlaylist });
      return;
    }

    // Fetch playlist details from Spotify
    const details = await getDetails(url);
    if (!details || !details.preview) {
      res.status(404).json({ success: false, message: "Could not fetch playlist details from Spotify." });
      return;
    }

    const { preview, tracks } = details;

    // Create new Playlist
    const newPlaylist = new Playlist({
      spotifyId,
      name: preview.title || "Imported Playlist",
      description: preview.description || "",
      coverImage: preview.image || "",
      owner: "Imported",
      tracks: [],
      totalTracks: 0,
      isPublic: true,
      importStatus: "importing"
    });

    await newPlaylist.save();
    
    // Return immediately to frontend
    res.status(202).json({ success: true, playlist: newPlaylist, message: "Import started" });

    // --- BACKGROUND PROCESS ---
    (async () => {
      try {
        let savedTracksCount = 0;

        for (const t of tracks) {
          if (!t.uri) continue;
          
          const trackSpotifyId = t.uri.replace("spotify:track:", "");
          
          const song = await downloadAudio(
            t.name || "Unknown Title",
            t.artist || "Unknown Artist",
            trackSpotifyId,
            t.duration_ms || t.duration || 0,
            "Spotify Import",
            preview.image || ""
          );

          // Add to playlist if successful
          if (song && song._id && song.status === "ready") {
            // Check if track exists
            let existingTrack = await Track.findOne({ spotifyId: trackSpotifyId });
            
            if (!existingTrack) {
              existingTrack = new Track({
                spotifyId: trackSpotifyId,
                title: t.name || "Unknown Title",
                artist: t.artist || "Unknown Artist",
                album: "Spotify Import",
                albumArt: preview.image || "",
                duration: t.duration_ms || t.duration || 0,
              });
              await existingTrack.save();
            }

            newPlaylist.tracks.push(existingTrack._id);
            savedTracksCount++;
            newPlaylist.totalTracks = savedTracksCount;
            await newPlaylist.save();
          }
        }

        newPlaylist.importStatus = "completed";
        await newPlaylist.save();
      } catch (err) {
        console.error("Background import failed:", err);
        newPlaylist.importStatus = "failed";
        await newPlaylist.save();
      }
    })();

  } catch (error: any) {
    console.error("Import Playlist Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to import playlist" });
  }
};
