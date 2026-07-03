export type Platform = 'youtube' | 'instagram';
export type VideoStatus = 'pending' | 'downloading' | 'processing' | 'generating_script' | 'creating_tts' | 'rendering' | 'ready' | 'scheduled' | 'posted' | 'failed';
export type JobType = 'download' | 'script' | 'tts' | 'subtitle' | 'render' | 'post';
export interface SocialAccount {
    id: string;
    user_id: string;
    platform: Platform;
    platform_user_id: string;
    platform_username: string | null;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
    account_metadata: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface VideoQueueItem {
    id: string;
    user_id: string;
    source_url: string;
    start_timestamp: string;
    end_timestamp: string;
    topic_input: string | null;
    generated_script: string | null;
    script_language: string;
    voice_name: string;
    output_video_path: string | null;
    output_audio_path: string | null;
    subtitle_path: string | null;
    target_account_ids: string[];
    status: VideoStatus;
    error_message: string | null;
    processing_progress: number;
    scheduled_for: string | null;
    posted_at: string | null;
    platform_post_ids: Record<string, string>;
    auto_generated_title: string | null;
    auto_generated_hashtags: string[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface ProcessingJob {
    id: string;
    video_queue_id: string;
    job_type: JobType;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: string | null;
    completed_at: string | null;
    error_details: string | null;
    retry_count: number;
}
export interface WhisperWord {
    word: string;
    start: number;
    end: number;
}
export interface GeminiResponse {
    script: string;
    title: string;
    hashtags: string[];
}
export interface VideoProcessingOptions {
    videoId: string;
    sourceUrl: string;
    startTime: string;
    endTime: string;
    topic?: string;
    script?: string;
    voiceName?: string;
    language?: string;
    targetAccounts?: string[];
}
export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}
export interface PlatformPostResult {
    platform: Platform;
    success: boolean;
    postId?: string;
    error?: string;
}
export interface SchedulerSettings {
    enabled: boolean;
    days_of_week: number[];
    videos_per_day: number;
    time_slots: string[];
}
export declare const DEFAULT_SCHEDULER_SETTINGS: SchedulerSettings;
export declare function normalizeSchedulerSettings(raw: unknown): SchedulerSettings;
//# sourceMappingURL=index.d.ts.map