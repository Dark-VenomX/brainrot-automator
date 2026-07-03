import type { VideoQueueItem, ProcessingJob } from '../types';
export declare class VideoPipeline {
    private tempDir;
    private outputDir;
    constructor(tempDir?: string, outputDir?: string);
    updateProgress(videoId: string, status: string, progress: number, errorMessage?: string): Promise<void>;
    createJob(videoId: string, jobType: string): Promise<ProcessingJob>;
    completeJob(jobId: string, errorDetails?: string): Promise<void>;
    processVideo(videoId: string): Promise<string>;
    postVideo(videoId: string): Promise<void>;
    /**
     * Forcefully unlink (delete) every heavy local file associated with a
     * video: the final rendered .mp4 in /app/outputs, the TTS audio in
     * /app/temp, the .ass subtitle, and any leftover segment files.
     * The database row is preserved with metadata only.
     */
    purgeLocalArtifacts(video: VideoQueueItem): Promise<void>;
    /**
     * Read the sandbox_mode flag for a user from their profile row.
     * Defaults to false if the row or column is missing.
     */
    isSandboxMode(userId: string): Promise<boolean>;
}
export declare const videoPipeline: VideoPipeline;
//# sourceMappingURL=pipeline.d.ts.map