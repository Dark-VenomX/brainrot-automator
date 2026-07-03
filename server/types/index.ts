export type Platform = 'youtube' | 'instagram';

export type VideoStatus =
  | 'pending'
  | 'downloading'
  | 'processing'
  | 'generating_script'
  | 'creating_tts'
  | 'rendering'
  | 'ready'
  | 'scheduled'
  | 'posted'
  | 'failed';

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

// =====================
// Scheduler Settings
// =====================

export interface SchedulerSettings {
  enabled: boolean;
  days_of_week: number[];
  videos_per_day: number;
  time_slots: string[];
}

export const DEFAULT_SCHEDULER_SETTINGS: SchedulerSettings = {
  enabled: true,
  days_of_week: [1, 2, 3, 4, 5],
  videos_per_day: 2,
  time_slots: ['12:30', '19:30'],
};

export function normalizeSchedulerSettings(raw: unknown): SchedulerSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SCHEDULER_SETTINGS };
  }

  const obj = raw as Record<string, unknown>;

  const days = Array.isArray(obj.days_of_week)
    ? (obj.days_of_week as unknown[])
        .filter(d => typeof d === 'number' && d >= 0 && d <= 6)
        .map(d => d as number)
    : DEFAULT_SCHEDULER_SETTINGS.days_of_week;

  const slots = Array.isArray(obj.time_slots)
    ? (obj.time_slots as unknown[])
        .filter(s => typeof s === 'string' && /^\d{1,2}:\d{2}$/.test(s))
        .map(s => s as string)
    : DEFAULT_SCHEDULER_SETTINGS.time_slots;

  const perDay = typeof obj.videos_per_day === 'number' && obj.videos_per_day > 0
    ? Math.min(Math.floor(obj.videos_per_day), 24)
    : DEFAULT_SCHEDULER_SETTINGS.videos_per_day;

  return {
    enabled: typeof obj.enabled === 'boolean' ? obj.enabled : DEFAULT_SCHEDULER_SETTINGS.enabled,
    days_of_week: days.length > 0 ? days : DEFAULT_SCHEDULER_SETTINGS.days_of_week,
    videos_per_day: perDay,
    time_slots: slots.length > 0 ? slots : DEFAULT_SCHEDULER_SETTINGS.time_slots,
  };
}
