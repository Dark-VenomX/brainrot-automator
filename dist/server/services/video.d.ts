import type { WhisperWord } from '../types';
export declare class VideoService {
    private tempDir;
    private outputDir;
    constructor(tempDir?: string, outputDir?: string);
    parseTimestamp(timestamp: string): number;
    getVideoInfo(url: string): Promise<{
        duration: number;
        title?: string;
    }>;
    downloadSegment(url: string, startTime: string, endTime: string, outputFilename?: string): Promise<string>;
    clipVideo(inputPath: string, startSeconds: number, durationSeconds: number, outputPath?: string): Promise<string>;
    getLocalVideoInfo(inputPath: string): Promise<{
        width: number;
        height: number;
        duration: number;
        fps: number;
    }>;
    needsSmartCrop(width: number, height: number): boolean;
    generateASSSubtitle(words: WhisperWord[], outputPath?: string): string;
    writeASSSubtitle(words: WhisperWord[], outputPath?: string): Promise<string>;
    renderFinalVideo(videoPath: string, audioPath: string, subtitlePath: string, outputPath?: string, backgroundVolume?: number, voiceVolume?: number): Promise<string>;
    getAudioDuration(audioPath: string): Promise<number>;
    cleanupFiles(filePaths: string[]): Promise<void>;
}
export declare const videoService: VideoService;
//# sourceMappingURL=video.d.ts.map