import ffmpeg from 'fluent-ffmpeg';
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Compresses an audio file using ffmpeg to a smaller MP3 format.
 * 
 * @param inputPath - The path to the original audio file
 * @param outputPath - The path where the compressed file should be saved
 * @param bitrate - The target audio bitrate (default: 160k)
 */
export const compressAudio = (inputPath: string, outputPath: string, bitrate: string = "160k"): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate(bitrate)
      .audioCodec('libmp3lame')
      .format('mp3')
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        console.error('ffmpeg transcoding error:', err);
        reject(err);
      })
      .save(outputPath);
  });
};
