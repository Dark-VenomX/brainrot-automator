import type { VideoStatus } from './database.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface VideoQueueItem {
  id: string;
  source_url: string;
  start_timestamp: string;
  end_timestamp: string;
  topic_input: string | null;
  generated_script: string | null;
  voice_name: string;
  output_video_path: string | null;
  target_account_ids: string[];
  status: VideoStatus;
  error_message: string | null;
  processing_progress: number;
  scheduled_for: string | null;
  posted_at: string | null;
  auto_generated_title: string | null;
  auto_generated_hashtags: string[];
  created_at: string;
}

interface SocialAccount {
  id: string;
  platform: 'youtube' | 'instagram';
  platform_user_id: string;
  platform_username: string | null;
  is_active: boolean;
}

interface CreateVideoOptions {
  source_url: string;
  start_timestamp?: string;
  end_timestamp?: string;
  topic_input?: string;
  generated_script?: string;
  voice_name?: string;
  target_account_ids?: string[];
  auto_schedule?: boolean;
}

interface SchedulerSettings {
  enabled: boolean;
  days_of_week: number[];
  videos_per_day: number;
  time_slots: string[];
}

interface SelfSufficiencyMetric {
  days: number;
  scheduledCount: number;
  slotsPerDay: number;
}

interface DiagnosticStep {
  step: string;
  ok: boolean;
  detail?: string;
}

interface DiagnosticResult {
  ok: boolean;
  output_path: string;
  script: string;
  title: string;
  hashtags: string[];
  word_count: number;
  audio_duration_ms: number;
  video_info: {
    width: number;
    height: number;
    duration: number;
    fps: number;
    smart_cropped: boolean;
  };
  steps: DiagnosticStep[];
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = API_URL;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // OAuth
  async getYouTubeAuthUrl(): Promise<{ authUrl: string }> {
    return this.fetch('/api/oauth/youtube');
  }

  async getInstagramAuthUrl(): Promise<{ authUrl: string }> {
    return this.fetch('/api/oauth/instagram');
  }

  async getAccounts(): Promise<{ accounts: SocialAccount[] }> {
    return this.fetch('/api/accounts');
  }

  async unlinkAccount(accountId: string): Promise<{ success: boolean }> {
    return this.fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
  }

  // Videos
  async createVideo(options: CreateVideoOptions): Promise<{ video: VideoQueueItem }> {
    return this.fetch('/api/videos', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getVideos(status?: VideoStatus): Promise<{ videos: VideoQueueItem[] }> {
    const query = status ? `?status=${status}` : '';
    return this.fetch(`/api/videos${query}`);
  }

  async getVideo(videoId: string): Promise<{ video: VideoQueueItem }> {
    return this.fetch(`/api/videos/${videoId}`);
  }

  async updateVideo(videoId: string, updates: Partial<CreateVideoOptions>): Promise<{ video: VideoQueueItem }> {
    return this.fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteVideo(videoId: string): Promise<{ success: boolean }> {
    return this.fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
  }

  async approveVideo(videoId: string): Promise<{ success: boolean; scheduled_for: string }> {
    return this.fetch(`/api/videos/${videoId}/approve`, { method: 'POST' });
  }

  async reprocessVideo(videoId: string): Promise<{ success: boolean; message: string }> {
    return this.fetch(`/api/videos/${videoId}/reprocess`, { method: 'POST' });
  }

  // AI
  async generateScript(topic: string, videoContext?: string): Promise<{ script: string; title: string; hashtags: string[] }> {
    return this.fetch('/api/ai/script', {
      method: 'POST',
      body: JSON.stringify({ topic, video_context: videoContext }),
    });
  }

  async getVoices(language?: string): Promise<{ voices: string[] }> {
    const query = language ? `?language=${language}` : '';
    return this.fetch(`/api/voices${query}`);
  }

  // Scheduler
  async getSchedulerSettings(): Promise<{ settings: SchedulerSettings }> {
    return this.fetch('/api/scheduler/settings');
  }

  async saveSchedulerSettings(settings: SchedulerSettings): Promise<{ settings: SchedulerSettings }> {
    return this.fetch('/api/scheduler/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getSelfSufficiency(): Promise<SelfSufficiencyMetric> {
    return this.fetch('/api/scheduler/self-sufficiency');
  }

  async getSchedulerStatus(): Promise<{ isRunning: boolean; timezone: string }> {
    return this.fetch('/api/scheduler/status');
  }

  // Sandbox Test Mode
  async getSandboxMode(): Promise<{ sandbox_mode: boolean }> {
    return this.fetch('/api/dev/sandbox');
  }

  async setSandboxMode(sandbox_mode: boolean): Promise<{ sandbox_mode: boolean }> {
    return this.fetch('/api/dev/sandbox', {
      method: 'PUT',
      body: JSON.stringify({ sandbox_mode }),
    });
  }

  // Diagnostic test render
  async runTestRender(opts?: {
    url?: string;
    start?: string;
    end?: string;
    topic?: string;
  }): Promise<DiagnosticResult> {
    return this.fetch('/api/dev/test-render', {
      method: 'POST',
      body: JSON.stringify(opts || {}),
    });
  }
}

export const apiClient = new ApiClient();
export type { VideoQueueItem, SocialAccount, CreateVideoOptions, SchedulerSettings, SelfSufficiencyMetric, DiagnosticResult, DiagnosticStep };
