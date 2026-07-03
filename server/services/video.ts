import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { exec } from 'child_process';
import util from 'util';
import type { WhisperWord } from '../types';
import logger from '../utils/logger';

const execAsync = util.promisify(exec);

// Use yt-dlp from PATH since it's installed globally via pip in Docker
const YT_DLP_PATH = 'yt-dlp';

// Set paths for ffmpeg and ffprobe
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export class VideoService {
  private tempDir: string;
  private outputDir: string;

  constructor(tempDir?: string, outputDir?: string) {
    this.tempDir = tempDir || process.env.TEMP_DIR || path.join(process.cwd(), 'temp');
    this.outputDir = outputDir || process.env.OUTPUT_DIR || path.join(process.cwd(), 'outputs');
  }

  parseTimestamp(timestamp: string): number {
    if (/^\d+$/.test(timestamp)) return parseInt(timestamp, 10);
    const parts = timestamp.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  async getVideoInfo(url: string): Promise<{ duration: number; title?: string }> {
    try {
      const command = `${YT_DLP_PATH} --dump-json --no-warnings --no-call-home --no-check-certificate --youtube-skip-dash-manifest "${url}"`;
      const { stdout } = await execAsync(command);
      const info = JSON.parse(stdout);
      
      return {
        duration: info.duration || 0,
        title: info.title,
      };
    } catch (error) {
      logger.error(`Failed to get video info: ${error}`);
      throw error;
    }
  }

  async downloadSegment(
    url: string,
    startTime: string,
    endTime: string,
    outputFilename?: string,
  ): Promise<string> {
    const outputPath = outputFilename || path.join(this.tempDir, `segment_${Date.now()}.mp4`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    try {
      logger.info(`Downloading segment from ${url} (${startTime} to ${endTime})`);
      const command = `${YT_DLP_PATH} --download-sections "*${startTime}-${endTime}" -o "${outputPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --force-keyframes-at-cuts --no-warnings --no-call-home --no-check-certificate "${url}"`;
      
      await execAsync(command);
      return outputPath;
    } catch (error) {
      logger.error(`Failed to download segment: ${error}`);
      throw error;
    }
  }

  async clipVideo(
    inputPath: string,
    startSeconds: number,
    durationSeconds: number,
    outputPath?: string,
  ): Promise<string> {
    const finalPath = outputPath || path.join(this.tempDir, `clipped_${Date.now()}.mp4`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startSeconds)
        .setDuration(durationSeconds)
        .outputOptions('-c:v copy')
        .outputOptions('-c:a copy')
        .save(finalPath)
        .on('end', () => resolve(finalPath))
        .on('error', (err) => reject(err));
    });
  }

  async getLocalVideoInfo(
    inputPath: string,
  ): Promise<{ width: number; height: number; duration: number; fps: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) return reject(new Error('No video stream found'));
        
        // Calculate fps from r_frame_rate (e.g., "30000/1001")
        let fps = 30;
        if (videoStream.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/');
          if (num && den) fps = parseInt(num) / parseInt(den);
        }
        
        resolve({
          width: videoStream.width || 1920,
          height: videoStream.height || 1080,
          duration: metadata.format.duration || 0,
          fps
        });
      });
    });
  }

  needsSmartCrop(width: number, height: number): boolean {
    const aspectRatio = width / height;
    // If aspect ratio is wider than 1.3 (like 16:9), it needs cropping to 9:16
    return aspectRatio > 1.3;
  }

  generateASSSubtitle(words: WhisperWord[], outputPath?: string): string {
    const header = `[Script Info]
Title: Brainrot Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Brainrot,Arial,20,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,1,5,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

    const events: string[] = [];
    words.forEach((word) => {
      const startMs = word.start;
      const endMs = word.end;
      const startH = Math.floor(startMs / 3600000);
      const startM = Math.floor((startMs % 3600000) / 60000);
      const startS = Math.floor((startMs % 60000) / 1000);
      const startCs = Math.floor((startMs % 1000) / 10);
      const endH = Math.floor(endMs / 3600000);
      const endM = Math.floor((endMs % 3600000) / 60000);
      const endS = Math.floor((endMs % 60000) / 1000);
      const endCs = Math.floor((endMs % 1000) / 10);
      const startTime = `${startH}:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}.${String(startCs).padStart(2, '0')}`;
      const endTime = `${endH}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}.${String(endCs).padStart(2, '0')}`;
      const escapedWord = word.word.replace(/[{}\\\]]/g, '\\$&');
      events.push(`Dialogue: 0,${startTime},${endTime},Brainrot,,0,0,0,,{\\kf100}${escapedWord}`);
    });

    return `${header}\n${events.join('\n')}`;
  }

  async writeASSSubtitle(words: WhisperWord[], outputPath?: string): Promise<string> {
    const subtitlePath = outputPath || path.join(this.tempDir, `subs_${Date.now()}.ass`);
    const content = this.generateASSSubtitle(words, subtitlePath);
    await fs.mkdir(path.dirname(subtitlePath), { recursive: true });
    await fs.writeFile(subtitlePath, content, 'utf8');
    logger.info(`Generated ASS subtitle: ${subtitlePath}`);
    return subtitlePath;
  }

  async renderFinalVideo(
    videoPath: string,
    audioPath: string,
    subtitlePath: string,
    outputPath?: string,
    backgroundVolume: number = 0.1,
    voiceVolume: number = 1.0,
  ): Promise<string> {
    const finalPath = outputPath || path.join(this.outputDir, `final_${Date.now()}.mp4`);
    await fs.mkdir(path.dirname(finalPath), { recursive: true });

    try {
      const info = await this.getLocalVideoInfo(videoPath);
      const crop = this.needsSmartCrop(info.width, info.height);
      
      // Escape paths for ffmpeg filters
      const escSubtitlePath = subtitlePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

      return new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath)
          .input(audioPath);

        // Build complex filter for cropping, volume, and subtitles
        let filterParts = [];
        
        // 1. Audio mixing
        filterParts.push(`[0:a]volume=${backgroundVolume}[bg]`);
        filterParts.push(`[1:a]volume=${voiceVolume}[vo]`);
        filterParts.push(`[bg][vo]amix=inputs=2:duration=first:dropout_transition=2[aout]`);
        
        // 2. Video cropping & subtitles
        let vout = '[0:v]';
        if (crop) {
          // Crop to 9:16 aspect ratio (e.g., 1080x1920)
          const targetW = Math.round(info.height * (9 / 16));
          filterParts.push(`[0:v]crop=${targetW}:${info.height}:(in_w-${targetW})/2:0[cropped]`);
          vout = '[cropped]';
        }
        
        // Add subtitles
        filterParts.push(`${vout}ass=${escSubtitlePath}[vout]`);

        command
          .complexFilter(filterParts.join(';'), ['vout', 'aout'])
          .outputOptions([
            '-c:v libx264',
            '-preset veryfast',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k',
            '-movflags +faststart',
            '-shortest' // Stop encoding when the shortest input ends (usually the video clip)
          ])
          .save(finalPath)
          .on('start', (cmdLine) => {
            logger.info(`FFmpeg started: ${cmdLine}`);
          })
          .on('end', () => {
            logger.info(`Rendered final video: ${finalPath}`);
            resolve(finalPath);
          })
          .on('error', (err) => {
            logger.error(`FFmpeg error: ${err.message}`);
            reject(err);
          });
      });
    } catch (error) {
      logger.error(`Render failed: ${error}`);
      throw error;
    }
  }

  async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration || 0);
      });
    });
  }

  async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch {}
    }
    logger.info('Cleaned up temporary files');
  }
}

export const videoService = new VideoService();
