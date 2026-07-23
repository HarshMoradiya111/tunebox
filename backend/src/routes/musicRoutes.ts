import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

// 1. Configure the strict MusicBrainz identity rules
const musicBrainz = axios.create({
  baseURL: "https://musicbrainz.org/ws/2",
  headers: {
    "User-Agent": "TuneBox/1.0.0 ( tunebox-dev@example.com )", // Change to your email
    Accept: "application/json",
  },
});

// 2. Create the Homepage API Route
router.get("/homepage", async (req: Request, res: Response) => {
  try {
    // Fetch top official music releases from the database
    const response = await musicBrainz.get("/release", {
      params: {
        query: "date:2026 AND status:official",
        fmt: "json",
      },
    });

    // Extract the raw album/song array from the data
    const tracks: any[] = response.data.releases || [];

    // Map through the results to format them nicely for your frontend UI
    const formattedTracks = tracks.slice(0, 10).map((track) => ({
      id: track.id,
      title: track.title,
      artist: track["artist-credit"]?.[0]?.name || "Unknown Artist",
      date: track.date,
      // Create the direct URL to grab the album cover art image later
      coverArtUrl: `https://coverartarchive.org/release/${track.id}/front`,
    }));

    res.json({ success: true, data: formattedTracks });
  } catch (error: any) {
    console.error("MusicBrainz Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch homepage data" });
  }
});

export default router;
