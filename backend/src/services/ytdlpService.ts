import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import config from "../config";

/**
 * Sanitize a string for use as a filename.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 100)
    .trim();
}

export interface DownloadResult {
  filePath: string;
  filename: string;
  title: string;
  fileSize: number;
}

/**
 * Search YouTube for a song and download it as MP3 using yt-dlp.
 *
 * @param title - Song title
 * @param artist - Artist name
 * @returns Promise resolving to the downloaded file info
 */
export function searchAndDownload(
  title: string,
  artist: string
): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    const libraryDir = config.libraryPath;

    // Ensure library directory exists
    if (!fs.existsSync(libraryDir)) {
      fs.mkdirSync(libraryDir, { recursive: true });
    }

    const sanitizedName = sanitizeFilename(`${artist} - ${title}`);
    const outputTemplate = path.join(libraryDir, `${sanitizedName}.%(ext)s`);
    const expectedFile = path.join(libraryDir, `${sanitizedName}.mp3`);

    // If already downloaded, return immediately
    if (fs.existsSync(expectedFile)) {
      const stats = fs.statSync(expectedFile);
      resolve({
        filePath: expectedFile,
        filename: `${sanitizedName}.mp3`,
        title: `${artist} - ${title}`,
        fileSize: stats.size,
      });
      return;
    }

    const searchQuery = `${title} ${artist} audio`;

    const args = [
      `ytsearch1:${searchQuery}`, // Search YouTube, take first result
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0", // Best quality
      "--output",
      outputTemplate,
      "--no-playlist",
      "--no-warnings",
      "--quiet",
      "--no-check-certificates",
      "--prefer-ffmpeg",
      "--add-metadata",
      "--embed-thumbnail",
      "--max-filesize",
      "50m", // Safety limit
    ];

    console.log(`🎵 Downloading: "${title}" by ${artist}`);

    execFile("yt-dlp", args, { timeout: 120_000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ yt-dlp error for "${title}":`, error.message);
        if (stderr) console.error("stderr:", stderr);
        reject(new Error(`Download failed for "${title}" by ${artist}: ${error.message}`));
        return;
      }

      // Find the output file (yt-dlp may use slightly different naming)
      if (fs.existsSync(expectedFile)) {
        const stats = fs.statSync(expectedFile);
        console.log(
          `✅ Downloaded: ${sanitizedName}.mp3 (${(stats.size / 1024 / 1024).toFixed(1)} MB)`
        );
        resolve({
          filePath: expectedFile,
          filename: `${sanitizedName}.mp3`,
          title: `${artist} - ${title}`,
          fileSize: stats.size,
        });
      } else {
        // Try to find any file matching the sanitized name
        const files = fs.readdirSync(libraryDir);
        const match = files.find((f) => f.startsWith(sanitizedName));
        if (match) {
          const matchPath = path.join(libraryDir, match);
          const stats = fs.statSync(matchPath);
          resolve({
            filePath: matchPath,
            filename: match,
            title: `${artist} - ${title}`,
            fileSize: stats.size,
          });
        } else {
          reject(
            new Error(
              `Download completed but output file not found for "${title}" by ${artist}`
            )
          );
        }
      }
    });
  });
}

/**
 * Get audio file duration in seconds using music-metadata.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  // Dynamic import for ESM module
  const mm = await import("music-metadata");
  const metadata = await mm.parseFile(filePath);
  return Math.round(metadata.format.duration || 0);
}
