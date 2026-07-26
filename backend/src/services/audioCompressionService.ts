// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
const ffmpegPath = require('ffmpeg-static');

// Ensure executable permissions on Linux/Unix systems in cloud environments
try {
  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    fs.chmodSync(ffmpegPath, 0o775);
  }
} catch (permError) {
  console.warn('Could not set execution permissions on ffmpeg-static binary:', permError);
}

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * Compresses an audio file using ffmpeg to a smaller MP3 format.
 * 
 * @param inputPath - The path to the original audio file
 * @param outputPath - The path where the compressed file should be saved
 * @param bitrate - The target audio bitrate (default: 160k)
 */
export const compressAudio = (inputPath: string, outputPath: string, bitrate: string = "160k"): Promise<void> => {
  return new Promise((resolve, reject) => {
    const runFfmpeg = (useSystemFfmpeg: boolean = false) => {
      const command = ffmpeg(inputPath);
      if (useSystemFfmpeg) {
        command.setFfmpegPath('ffmpeg');
      }

      command
        .audioBitrate(bitrate)
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('end', () => {
          resolve();
        })
        .on('error', (err: any) => {
          console.error(`ffmpeg transcoding error (${useSystemFfmpeg ? 'system binary' : 'static binary'}):`, err);
          if (!useSystemFfmpeg && ffmpegPath) {
            console.log("Retrying audio compression using global system 'ffmpeg' command...");
            runFfmpeg(true);
          } else {
            reject(err);
          }
        })
        .save(outputPath);
    };

    runFfmpeg(false);
  });
};
