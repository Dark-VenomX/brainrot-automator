"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoPipeline = exports.VideoPipeline = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const supabase_1 = require("../utils/supabase");
const ai_1 = require("./ai");
const video_1 = require("./video");
const posting_1 = require("./posting");
const logger_1 = __importDefault(require("../utils/logger"));
class VideoPipeline {
    constructor(tempDir, outputDir) {
        this.tempDir = tempDir || process.env.TEMP_DIR || path_1.default.join(process.cwd(), 'temp');
        this.outputDir = outputDir || process.env.OUTPUT_DIR || path_1.default.join(process.cwd(), 'outputs');
    }
    async updateProgress(videoId, status, progress, errorMessage) {
        const updateData = {
            status,
            processing_progress: progress,
        };
        if (errorMessage) {
            updateData.error_message = errorMessage;
        }
        await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .update(updateData)
            .eq('id', videoId);
    }
    async createJob(videoId, jobType) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.PROCESSING_JOBS)
            .insert({
            video_queue_id: videoId,
            job_type: jobType,
            status: 'running',
            started_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async completeJob(jobId, errorDetails) {
        await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.PROCESSING_JOBS)
            .update({
            status: errorDetails ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            error_details: errorDetails || null,
        })
            .eq('id', jobId);
    }
    async processVideo(videoId) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('id', videoId)
            .single();
        if (error || !data) {
            throw new Error(`Video ${videoId} not found`);
        }
        const video = data;
        const cleanupFiles = [];
        try {
            await this.updateProgress(videoId, 'downloading', 5);
            const downloadJob = await this.createJob(videoId, 'download');
            const tempPrefix = `${videoId}_${Date.now()}`;
            const segmentPath = path_1.default.join(this.tempDir, `${tempPrefix}_segment.mp4`);
            const downloadedFile = await video_1.videoService.downloadSegment(video.source_url, video.start_timestamp, video.end_timestamp, segmentPath);
            cleanupFiles.push(downloadedFile);
            await this.completeJob(downloadJob.id);
            await this.updateProgress(videoId, 'generating_script', 15);
            const scriptJob = await this.createJob(videoId, 'script');
            let script = video.generated_script;
            let title = video.auto_generated_title;
            let hashtags = video.auto_generated_hashtags;
            let metadataObj = video.metadata || {};
            if (!script || video.topic_input) {
                const geminiResponse = await ai_1.aiService.generateScript(video.topic_input || 'interesting topic', `Source video: ${video.source_url}`, metadataObj.niche, metadataObj.aspect_ratio);
                script = geminiResponse.script;
                title = geminiResponse.title;
                hashtags = geminiResponse.hashtags;
                if (geminiResponse.viral_strategy) {
                    metadataObj.viral_strategy = geminiResponse.viral_strategy;
                }
            }
            if (!title || hashtags.length === 0) {
                const metadata = await ai_1.aiService.generateMetadata(script || '', video.topic_input || undefined);
                if (!title)
                    title = metadata.title;
                if (hashtags.length === 0)
                    hashtags = metadata.hashtags;
            }
            await supabase_1.supabaseAdmin
                .from(supabase_1.TABLES.VIDEO_QUEUE)
                .update({
                generated_script: script,
                auto_generated_title: title,
                auto_generated_hashtags: hashtags,
                metadata: metadataObj,
            })
                .eq('id', videoId);
            await this.completeJob(scriptJob.id);
            await this.updateProgress(videoId, 'creating_tts', 30);
            const ttsJob = await this.createJob(videoId, 'tts');
            const ttsPath = path_1.default.join(this.tempDir, `${tempPrefix}_tts.mp3`);
            await ai_1.ttsService.generateSpeech(script, video.voice_name, ttsPath);
            cleanupFiles.push(ttsPath);
            const ttsDuration = await video_1.videoService.getAudioDuration(ttsPath);
            await supabase_1.supabaseAdmin
                .from(supabase_1.TABLES.VIDEO_QUEUE)
                .update({ output_audio_path: ttsPath })
                .eq('id', videoId);
            await this.completeJob(ttsJob.id);
            await this.updateProgress(videoId, 'rendering', 45);
            const subtitleJob = await this.createJob(videoId, 'subtitle');
            let wordTimestamps;
            try {
                wordTimestamps = await ai_1.whisperService.transcribeWithTimestamps(ttsPath);
            }
            catch (whisperError) {
                logger_1.default.warn(`Whisper failed, using fallback timing: ${whisperError}`);
                wordTimestamps = await ai_1.whisperService.fallbackWordTimestamps(script, ttsDuration);
            }
            const fontStyle = video.metadata?.font_style || 'classic';
            const assPath = await video_1.videoService.writeASSSubtitle(wordTimestamps, path_1.default.join(this.tempDir, `${tempPrefix}_subs.ass`), fontStyle);
            cleanupFiles.push(assPath);
            await supabase_1.supabaseAdmin
                .from(supabase_1.TABLES.VIDEO_QUEUE)
                .update({ subtitle_path: assPath })
                .eq('id', videoId);
            await this.completeJob(subtitleJob.id);
            await this.updateProgress(videoId, 'rendering', 60);
            const renderJob = await this.createJob(videoId, 'render');
            const outputPath = path_1.default.join(this.outputDir, `${videoId}.mp4`);
            const bgMusic = video.metadata?.bg_music || 'none';
            const aspectRatio = video.metadata?.aspect_ratio || '9:16';
            await video_1.videoService.renderFinalVideo(downloadedFile, ttsPath, assPath, outputPath, 0.1, 1.0, bgMusic, aspectRatio);
            await supabase_1.supabaseAdmin
                .from(supabase_1.TABLES.VIDEO_QUEUE)
                .update({
                output_video_path: outputPath,
                status: 'ready',
            })
                .eq('id', videoId);
            await this.completeJob(renderJob.id);
            await this.updateProgress(videoId, 'ready', 100);
            return outputPath;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
            logger_1.default.error(`Video processing failed for ${videoId}: ${errorMessage}`);
            await this.updateProgress(videoId, 'failed', 0, errorMessage);
            throw error;
        }
        finally {
            // Always clean up intermediate temp files (segment, tts, subs)
            // regardless of success/failure. The final rendered mp4 in /app/outputs
            // is kept until AFTER posting (see postVideo).
            await video_1.videoService.cleanupFiles(cleanupFiles);
        }
    }
    async postVideo(videoId) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('id', videoId)
            .single();
        if (error || !data) {
            throw new Error(`Video ${videoId} not found`);
        }
        const video = data;
        if (video.status !== 'ready' && video.status !== 'scheduled') {
            throw new Error(`Video ${videoId} is not ready for posting (status: ${video.status})`);
        }
        if (!video.output_video_path) {
            throw new Error(`Video ${videoId} has no output file`);
        }
        const targetAccountIds = video.target_account_ids;
        if (!targetAccountIds || targetAccountIds.length === 0) {
            throw new Error(`No target accounts specified for video ${videoId}`);
        }
        const { data: accountsData, error: accountsError } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.SOCIAL_ACCOUNTS)
            .select('*')
            .in('id', targetAccountIds)
            .eq('is_active', true);
        if (accountsError || !accountsData || accountsData.length === 0) {
            throw new Error('No active target accounts found');
        }
        const accounts = accountsData;
        // =====================
        // Sandbox Test Mode
        // =====================
        // If the user has enabled sandbox mode, skip the live social APIs
        // and simulate a successful post. The disk cleanup routine still
        // runs, so the behavior of the pipeline is identical except no
        // external API is contacted.
        const sandboxMode = await this.isSandboxMode(video.user_id);
        let results;
        if (sandboxMode) {
            logger_1.default.info(`[SANDBOX] Video ${videoId} — simulating posts (user has sandbox mode ON)`);
            results = await posting_1.postingService.mockPostToAllPlatforms(accounts, video.auto_generated_title || 'Check this out!');
        }
        else {
            results = await posting_1.postingService.postToAllPlatforms(accounts, video.output_video_path, video.auto_generated_title || 'Check this out!', video.generated_script || '', video.auto_generated_hashtags || []);
        }
        const platformPostIds = {};
        const platformPostUrls = {};
        let allSuccessful = true;
        for (const result of results) {
            if (result.success && result.postId) {
                platformPostIds[result.platform] = result.postId;
                // Store a human-readable dummy URL for sandbox posts so the UI
                // can display something meaningful even in test mode.
                if (sandboxMode) {
                    platformPostUrls[result.platform] =
                        result.platform === 'youtube'
                            ? `https://www.youtube.com/watch?v=${result.postId}`
                            : `https://www.instagram.com/reel/${result.postId}/`;
                }
            }
            else {
                allSuccessful = false;
                logger_1.default.error(`Failed to post to ${result.platform}: ${result.error}`);
            }
        }
        const updatePayload = {
            status: allSuccessful ? 'posted' : 'failed',
            posted_at: new Date().toISOString(),
            platform_post_ids: platformPostIds,
            error_message: allSuccessful ? null : 'Some platforms failed to post',
        };
        if (sandboxMode) {
            // Stash the dummy URLs in metadata so the UI can surface them
            updatePayload.metadata = {
                ...(video.metadata || {}),
                sandbox_mode: true,
                sandbox_post_urls: platformPostUrls,
            };
        }
        await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .update(updatePayload)
            .eq('id', videoId);
        // =====================
        // AGGRESSIVE DISK CLEANUP
        // =====================
        // The instant the render has been pushed to the social APIs, purge all
        // heavy local artifacts. The DB row retains only metadata strings
        // (script, URL, status, post IDs) — storage overhead approaches zero.
        if (allSuccessful) {
            await this.purgeLocalArtifacts(video);
        }
        if (!allSuccessful) {
            throw new Error('Some platforms failed to post');
        }
    }
    /**
     * Forcefully unlink (delete) every heavy local file associated with a
     * video: the final rendered .mp4 in /app/outputs, the TTS audio in
     * /app/temp, the .ass subtitle, and any leftover segment files.
     * The database row is preserved with metadata only.
     */
    async purgeLocalArtifacts(video) {
        const pathsToDelete = [
            video.output_video_path,
            video.output_audio_path,
            video.subtitle_path,
        ].filter((p) => Boolean(p));
        // Also sweep the temp/output dirs for any file prefixed with the video id
        // (covers intermediate segment files that may have been missed).
        try {
            const tempFiles = await promises_1.default.readdir(this.tempDir).catch(() => []);
            for (const f of tempFiles) {
                if (f.startsWith(video.id) || f.includes(video.id)) {
                    pathsToDelete.push(path_1.default.join(this.tempDir, f));
                }
            }
            const outFiles = await promises_1.default.readdir(this.outputDir).catch(() => []);
            for (const f of outFiles) {
                if (f.startsWith(video.id) || f.includes(video.id)) {
                    pathsToDelete.push(path_1.default.join(this.outputDir, f));
                }
            }
        }
        catch (err) {
            logger_1.default.warn(`Artifact sweep readdir failed: ${err}`);
        }
        let deletedCount = 0;
        for (const filePath of pathsToDelete) {
            try {
                await promises_1.default.unlink(filePath);
                deletedCount++;
            }
            catch (err) {
                // Ignore "not found" — already cleaned. Log other errors.
                if (err instanceof Error && 'code' in err && err.code !== 'ENOENT') {
                    logger_1.default.warn(`Failed to delete ${filePath}: ${err.message}`);
                }
            }
        }
        // Clear the path columns in the DB so only metadata remains.
        await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .update({
            output_video_path: null,
            output_audio_path: null,
            subtitle_path: null,
        })
            .eq('id', video.id);
        logger_1.default.info(`Purged ${deletedCount} local artifacts for video ${video.id} (metadata retained)`);
    }
    /**
     * Read the sandbox_mode flag for a user from their profile row.
     * Defaults to false if the row or column is missing.
     */
    async isSandboxMode(userId) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from(supabase_1.TABLES.PROFILES)
                .select('sandbox_mode')
                .eq('id', userId)
                .maybeSingle();
            if (error) {
                logger_1.default.warn(`isSandboxMode read failed: ${error.message}`);
                return false;
            }
            return Boolean(data?.sandbox_mode);
        }
        catch (err) {
            logger_1.default.warn(`isSandboxMode error: ${err}`);
            return false;
        }
    }
}
exports.VideoPipeline = VideoPipeline;
exports.videoPipeline = new VideoPipeline();
//# sourceMappingURL=pipeline.js.map