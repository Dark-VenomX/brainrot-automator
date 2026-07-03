// TEMPORARY STUB — native video deps (fluent-ffmpeg, yt-dlp) are not
// installed in this preview environment. All methods throw a clear error
// so the frontend can compile and run. Restore the real implementation
// (see git history) when deploying with the full Docker stack.

import fs from 'fs/promises';
import path from 'path';
import type { WhisperWord } from '../types';
import logger from '../utils/logger';

const STUB_MSG =
  'Video processing is not available in this preview environment. ' +
  'Run the full Docker stack (Dockerfile) with fluent-ffmpeg and yt-dlp installed.';

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

  async getVideoInfo(_url: string): Promise<{ duration: number; title?: string }> {
    throw new Error(STUB_MSG);
  }

  async downloadSegment(
    _url: string,
    _startTime: string,
    _endTime: string,
    _outputFilename?: string,
  ): Promise<string> {
    throw new Error(STUB_MSG);
  }

  async clipVideo(
    _inputPath: string,
    _startSeconds: number,
    _durationSeconds: number,
    _outputPath?: string,
  ): Promise<string> {
    throw new Error(STUB_MSG);
  }

  async getLocalVideoInfo(
    _inputPath: string,
  ): Promise<{ width: number; height: number; duration: number; fps: number }> {
    throw new Error(STUB_MSG);
  }

  needsSmartCrop(width: number, height: number): boolean {
    const aspectRatio = width / height;
    return aspectRatio > 1.3;
  }

  generateASSSubtitle(words: WhisperWord[], _outputPath?: string): string {
    const header = `[Script Info]
Title: Brainrot Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Brainrot,TheBoldFont,52,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,5,3,2,10,10,30,1

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
      const escapedWord = word.word.replace(/[{}\\]/g, '\\$&');
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
    _videoPath: string,
    _audioPath: string,
    _subtitlePath: string,
    _outputPath?: string,
    _backgroundVolume: number = 0.1,
    _voiceVolume: number = 1.0,
  ): Promise<string> {
    throw new Error(STUB_MSG);
  }

  async getAudioDuration(_audioPath: string): Promise<number> {
    throw new Error(STUB_MSG);
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
