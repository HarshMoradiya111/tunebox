import { Router, Request, Response } from "express";
import axios from "axios";
// @ts-ignore
import ytStream from "yt-stream";
import { importPlaylist } from "../controllers/importController";

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
    const ytSearch = require("yt-search");
    const youtubedl = require("youtube-dl-exec");

    let finalStreamUrl = null;

    try {
      const searchResults = await ytSearch(searchQuery);
      if (searchResults && searchResults.videos && searchResults.videos.length > 0) {
        const videoUrl = searchResults.videos[0].url;
        
        // Extract using youtube-dl-exec which handles signatures & IP blocks better
        const output = await youtubedl(videoUrl, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          addHeader: [
            'referer:youtube.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          ]
        });

        const formats = output.formats || [];
        const audioFormats = formats.filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none');
        
        if (audioFormats.length > 0) {
          audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));
          finalStreamUrl = audioFormats[0].url;
        }
      }
    } catch (ytError: any) {
      console.warn("YouTube extraction failed with youtube-dl-exec:", ytError.message);
    }

    // 3. Fallback to iTunes API if YouTube fails
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
      return res.status(404).json({ success: false, message: 'Audio stream unavailable' });
    }

    return res.status(200).json({
      success: true,
      audioUrl: finalStreamUrl,
      expiresIn: 'Temporary URL - Do not save to Database'
    });

  } catch (error: any) {
    console.error('Streaming Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to extract audio track' });
  }
});

router.post("/playlist/import", importPlaylist);

export default router;
