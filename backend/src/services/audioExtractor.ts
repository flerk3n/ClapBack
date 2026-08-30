import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Extracts the audio track from an MP4 video file.
 * Returns the path to the extracted MP3 file.
 */
export async function extractAudio(videoPath: string): Promise<string> {
  const dir = path.dirname(videoPath);
  const base = path.basename(videoPath, path.extname(videoPath));
  const audioPath = path.join(dir, `${base}_audio.mp3`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .output(audioPath)
      .on('end', () => {
        console.log(`[ffmpeg] Audio extracted → ${audioPath}`);
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('[ffmpeg] Extraction error:', err.message);
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Cleans up temp files after processing.
 */
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[cleanup] Removed ${filePath}`);
    }
  } catch (err) {
    console.warn(`[cleanup] Could not remove ${filePath}:`, err);
  }
}
