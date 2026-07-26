import mongoose from "mongoose";
import { Playlist } from "../models";
import { ISong } from "../models/Song";

/**
 * Normalizes a title or artist string for comparison:
 * lowercase, strip feat/ft tags, remove punctuation, collapse whitespace.
 */
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(feat\.|ft\.|featuring|with|prod\.)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds a matching local song from an array of local songs given Spotify metadata.
 * Uses normalized title + artist matching and secondary duration confidence check.
 */
export function findMatchingLocalSong(
  title: string,
  artist: string,
  durationMs: number,
  localSongs: ISong[]
): ISong | null {
  const normTargetTitle = normalizeString(title);
  const normTargetArtist = normalizeString(artist);

  if (!normTargetTitle) return null;

  const targetDurationSec = durationMs > 10000 ? durationMs / 1000 : durationMs;

  for (const song of localSongs) {
    const normLocalTitle = normalizeString(song.title);
    const normLocalArtist = normalizeString(song.artist);

    if (normLocalTitle !== normTargetTitle) {
      continue;
    }

    // Check if artists match or overlap (e.g. "Arijit Singh, Shreya Ghoshal" vs "Arijit Singh")
    const artistMatch =
      normLocalArtist === normTargetArtist ||
      (normLocalArtist.length > 2 && normTargetArtist.length > 2 &&
        (normLocalArtist.includes(normTargetArtist) || normTargetArtist.includes(normLocalArtist)));

    if (!artistMatch) {
      continue;
    }

    // Secondary confidence check: duration
    if (targetDurationSec > 0 && song.duration > 0) {
      const diffSec = Math.abs(song.duration - targetDurationSec);
      if (diffSec > 7) {
        // Duration mismatch (> 7 seconds difference), likely a different version/mix
        continue;
      }
    }

    // Match found!
    return song;
  }

  return null;
}

/**
 * Scans all playlists with missing tracks and automatically promotes matching songs
 * when a new local song is uploaded or becomes ready.
 */
export async function matchSongToMissingTracks(newSong: ISong): Promise<number> {
  if (!newSong || newSong.status !== "ready") return 0;

  try {
    const playlists = await Playlist.find({ "missingTracks.0": { $exists: true } });
    let updatedCount = 0;

    for (const playlist of playlists) {
      if (!playlist.missingTracks || playlist.missingTracks.length === 0) continue;

      let modified = false;
      const remainingMissing: any[] = [];

      for (const mt of playlist.missingTracks) {
        const match = findMatchingLocalSong(mt.title, mt.artist, mt.duration, [newSong]);
        if (match) {
          // Found match in newly uploaded song! Add to playlist tracks
          const songIdStr = newSong._id.toString();
          if (!playlist.tracks.some((id: any) => id.toString() === songIdStr)) {
            playlist.tracks.push(newSong._id as any);
          }
          modified = true;
        } else {
          remainingMissing.push(mt);
        }
      }

      if (modified) {
        playlist.missingTracks = remainingMissing;
        playlist.totalTracks = playlist.tracks.length + remainingMissing.length;
        await playlist.save();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`Auto-resolved missing tracks in ${updatedCount} playlists for song: ${newSong.title}`);
    }
    return updatedCount;
  } catch (err) {
    console.error("Error in matchSongToMissingTracks:", err);
    return 0;
  }
}
