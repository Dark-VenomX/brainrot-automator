import type { WhisperWord } from '../types';
export declare class VideoService {
    private tempDir;
    private outputDir;
    constructor(tempDir?: string, outputDir?: string);
    parseTimestamp(timestamp: string): number;
    getVideoInfo(_url: string): Promise<{
        duration: number;
        title?: string;
    }>;
    downloadSegment(_url: string, _startTime: string, _endTime: string, _outputFilename?: string): Promise<string>;
    clipVideo(_inputPath: string, _startSeconds: number, _durationSeconds: number, _outputPath?: string): Promise<string>;
    getLocalVideoInfo(_inputPath: string): Promise<{
        width: number;
        height: number;
        duration: number;
        fps: number;
    }>;
    needsSmartCrop(width: number, height: number): boolean;
    generateASSSubtitle(words: WhisperWord[], _outputPath?: string): string;
    writeASSSubtitle(words: WhisperWord[], outputPath?: string): Promise<string>;
    renderFinalVideo(_videoPath: string, _audioPath: string, _subtitlePath: string, _outputPath?: string, _backgroundVolume?: number, _voiceVolume?: number): Promise<string>;
    getAudioDuration(_audioPath: string): Promise<number>;
    cleanupFiles(filePaths: string[]): Promise<void>;
}
export declare const videoService: VideoService;
//# sourceMappingURL=video.d.ts.map