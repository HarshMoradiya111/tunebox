import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { getPlaylist } from "../src/services/spotifyApi";
import { Playlist, Track, Song } from "../src/models";
import { searchAndDownload, getAudioDuration } from "../src/services/ytdlpService";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const PLAYLISTS_TO_PREFETCH = [
  "37i9dQZEVXbMDoHDwVN2tF", // Top 50 - Global
  "37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits
];

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/tunebox";
  await mongoose.connect(uri);
  console.log("📦 Connected to MongoDB");
}

async function prefetchPlaylists() {
  await connectDB();

  for (const playlistId of PLAYLISTS_TO_PREFETCH) {
    console.log(`\n==================================================`);
    console.log(`🎵 Processing Playlist: ${playlistId}`);
    console.log(`==================================================\n`);

    try {
      let spotifyPlaylist: any;
      let trackItems: any[] = [];

      try {
        console.log("Fetching playlist metadata from Spotify...");
        spotifyPlaylist = await getPlaylist(playlistId);
        console.log(`Found: "${spotifyPlaylist.name}" with ${spotifyPlaylist.tracks.total} tracks.`);
        trackItems = spotifyPlaylist.tracks.items;
      } catch (err: any) {
        if (err.message && err.message.includes("SPOTIFY_CLIENT_ID")) {
          console.log("⚠️ Spotify credentials missing. Falling back to mock tracks for pre-fetch...");
          spotifyPlaylist = {
            name: playlistId === "37i9dQZEVXbMDoHDwVN2tF" ? "Top 50 - Global" : "Today's Top Hits",
            description: "Pre-fetched fallback playlist",
            images: [{ url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&h=500&fit=crop" }],
            owner: { display_name: "TuneBox" },
            tracks: { total: 3 },
            public: true
          };
          trackItems = [
            { track: { id: "mock1", name: "Blinding Lights", artists: [{ name: "The Weeknd" }], album: { name: "After Hours", images: [{ url: "" }] }, duration_ms: 200000, track_number: 1 } },
            { track: { id: "mock2", name: "Starboy", artists: [{ name: "The Weeknd" }], album: { name: "Starboy", images: [{ url: "" }] }, duration_ms: 230000, track_number: 2 } },
            { track: { id: "mock3", name: "Levitating", artists: [{ name: "Dua Lipa" }], album: { name: "Future Nostalgia", images: [{ url: "" }] }, duration_ms: 203000, track_number: 3 } },
          ];
        } else {
          throw err;
        }
      }

      // 2. Upsert Track Metadata
      console.log("Upserting track metadata to MongoDB...");
      const trackDocs = await Promise.all(
        trackItems
          .filter((item) => item.track !== null)
          .map(async (item) => {
            const t = item.track!;
            return Track.findOneAndUpdate(
              { spotifyId: t.id },
              {
                spotifyId: t.id,
                title: t.name,
                artist: t.artists.map((a: any) => a.name).join(", "),
                album: t.album.name,
                albumArt: t.album.images?.[0]?.url || "",
                duration: t.duration_ms,
                trackNumber: t.track_number,
                previewUrl: t.preview_url || undefined,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            ).lean();
          })
      );

      // 3. Upsert Playlist
      await Playlist.findOneAndUpdate(
        { spotifyId: playlistId },
        {
          spotifyId: playlistId,
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description || "",
          coverImage: spotifyPlaylist.images?.[0]?.url || "",
          owner: spotifyPlaylist.owner?.display_name || "",
          tracks: trackDocs.map((t) => t._id),
          totalTracks: spotifyPlaylist.tracks.total,
          isPublic: spotifyPlaylist.public ?? true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Playlist "${spotifyPlaylist.name}" metadata saved.`);

      // 4. Download missing audio tracks
      console.log(`\nDownloading audio tracks...`);
      for (let i = 0; i < trackDocs.length; i++) {
        const track = trackDocs[i];
        console.log(`[${i + 1}/${trackDocs.length}] Checking: "${track.title}" by ${track.artist}`);

        try {
          const existing = await Song.findOne({ spotifyTrackId: track.spotifyId });

          if (existing && existing.status === "ready") {
            console.log(`   ⚡ Already downloaded.`);
            continue;
          }

          console.log(`   ⬇️  Downloading...`);
          // Create or update to pending
          const songDoc = await Song.findOneAndUpdate(
            { spotifyTrackId: track.spotifyId },
            {
              spotifyTrackId: track.spotifyId,
              title: track.title,
              artist: track.artist,
              album: track.album,
              albumArt: track.albumArt,
              status: "downloading",
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          // Download
          const result = await searchAndDownload(track.title, track.artist);

          // Duration
          let duration = 0;
          try {
            duration = await getAudioDuration(result.filePath);
          } catch (e) {
            console.warn("   ⚠️ Could not extract audio duration:", e);
          }

          const streamUrl = `/api/stream/${encodeURIComponent(result.filename)}`;

          // Update to ready
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
          console.log(`   ✅ Download complete.`);
        } catch (err) {
          console.error(`   ❌ Failed to download "${track.title}":`, err instanceof Error ? err.message : String(err));
          await Song.updateOne(
            { spotifyTrackId: track.spotifyId },
            { status: "failed", errorMessage: String(err) }
          );
        }
      }
    } catch (err) {
      console.error(`❌ Failed to process playlist ${playlistId}:`, err);
    }
  }

  console.log(`\n🎉 All pre-fetching complete!`);
  mongoose.disconnect();
}

prefetchPlaylists();
