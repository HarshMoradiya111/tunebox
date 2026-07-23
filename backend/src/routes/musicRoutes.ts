import { Router, Request, Response } from "express";
import axios from "axios";
// @ts-ignore
import ytStream from "yt-stream";

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

router.get("/search", async (req: Request, res: Response): Promise<any> => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const response = await musicBrainz.get("/recording", {
      params: {
        query: query,
        fmt: "json",
      },
    });

    const recordings = response.data.recordings || [];

    const formattedTracks = recordings.slice(0, 20).map((track: any) => {
      // Find the first release ID to get cover art
      const releaseId = track.releases?.[0]?.id || "";
      const coverArtUrl = releaseId 
        ? `https://coverartarchive.org/release/${releaseId}/front` 
        : "";

      return {
        id: track.id,
        title: track.title,
        artist: track["artist-credit"]?.[0]?.name || "Unknown Artist",
        coverArtUrl,
      };
    });

    res.json({ success: true, data: formattedTracks });
  } catch (error: any) {
    console.error("MusicBrainz Search Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to perform search" });
  }
});

interface StreamRequest {
  title: string;
  artist: string;
}

router.post("/stream", async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, artist } = req.body as StreamRequest;

    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'Title and artist are required' });
    }

    // 1. Construct a clean search query to get the best audio track match
    const searchQuery = `${title} ${artist} audio`;

    // 2. Search YouTube programmatically
    const searchResults: any[] = await ytStream.search(searchQuery);
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Song audio track not found' });
    }

    // Grab the first video result ID
    const videoId = searchResults[0].id;

    // 3. Extract the direct raw audio formats
    const streamInfo = await ytStream.getInfo(videoId);
    
    // Filter out video tracks to find the lightweight .mp4/.webm audio stream URL
    const audioStream = streamInfo.formats.find((format: any) => 
      format.mimeType && format.mimeType.includes('audio/')
    );

    if (!audioStream || !audioStream.url) {
      return res.status(404).json({ success: false, message: 'Direct audio stream url unavailable' });
    }

    // 4. Return the temporary playable URL directly to the frontend player
    res.json({ 
      success: true, 
      audioUrl: audioStream.url,
      expiresIn: 'Temporary URL - Do not save to Database' 
    });

  } catch (error: any) {
    console.error('Streaming Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to extract audio track' });
  }
});

export default router;
