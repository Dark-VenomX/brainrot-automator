export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          gemini_api_key: string | null;
          plan: 'free' | 'pro' | 'enterprise';
          scheduler_settings: Json;
          scheduler_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          gemini_api_key?: string | null;
          plan?: 'free' | 'pro' | 'enterprise';
          scheduler_settings?: Json;
          scheduler_updated_at?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          gemini_api_key?: string | null;
          plan?: 'free' | 'pro' | 'enterprise';
          scheduler_settings?: Json;
          scheduler_updated_at?: string | null;
        };
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: 'youtube' | 'instagram';
          platform_user_id: string;
          platform_username: string | null;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          account_metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          platform: 'youtube' | 'instagram';
          platform_user_id: string;
          platform_username?: string | null;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          account_metadata?: Json;
          is_active?: boolean;
        };
        Update: {
          platform?: 'youtube' | 'instagram';
          platform_user_id?: string;
          platform_username?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          account_metadata?: Json;
          is_active?: boolean;
        };
      };
      video_queue: {
        Row: {
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
          platform_post_ids: Json;
          auto_generated_title: string | null;
          auto_generated_hashtags: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          source_url: string;
          start_timestamp?: string;
          end_timestamp?: string;
          topic_input?: string | null;
          generated_script?: string | null;
          script_language?: string;
          voice_name?: string;
          output_video_path?: string | null;
          output_audio_path?: string | null;
          subtitle_path?: string | null;
          target_account_ids?: string[];
          status?: VideoStatus;
          error_message?: string | null;
          processing_progress?: number;
          scheduled_for?: string | null;
          posted_at?: string | null;
          platform_post_ids?: Json;
          auto_generated_title?: string | null;
          auto_generated_hashtags?: string[];
          metadata?: Json;
        };
        Update: {
          source_url?: string;
          start_timestamp?: string;
          end_timestamp?: string;
          topic_input?: string | null;
          generated_script?: string | null;
          script_language?: string;
          voice_name?: string;
          output_video_path?: string | null;
          output_audio_path?: string | null;
          subtitle_path?: string | null;
          target_account_ids?: string[];
          status?: VideoStatus;
          error_message?: string | null;
          processing_progress?: number;
          scheduled_for?: string | null;
          posted_at?: string | null;
          platform_post_ids?: Json;
          auto_generated_title?: string | null;
          auto_generated_hashtags?: string[];
          metadata?: Json;
        };
      };
      processing_jobs: {
        Row: {
          id: string;
          video_queue_id: string;
          job_type: 'download' | 'script' | 'tts' | 'subtitle' | 'render' | 'post';
          status: 'pending' | 'running' | 'completed' | 'failed';
          started_at: string | null;
          completed_at: string | null;
          error_details: string | null;
          retry_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_queue_id: string;
          job_type: 'download' | 'script' | 'tts' | 'subtitle' | 'render' | 'post';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          started_at?: string | null;
          completed_at?: string | null;
          error_details?: string | null;
          retry_count?: number;
        };
        Update: {
          job_type?: 'download' | 'script' | 'tts' | 'subtitle' | 'render' | 'post';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          started_at?: string | null;
          completed_at?: string | null;
          error_details?: string | null;
          retry_count?: number;
        };
      };
      api_rate_limits: {
        Row: {
          id: string;
          user_id: string;
          service: 'gemini' | 'youtube' | 'instagram';
          requests_made: number;
          window_start: string;
          window_end: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          service: 'gemini' | 'youtube' | 'instagram';
          requests_made?: number;
          window_start?: string;
          window_end?: string | null;
        };
        Update: {
          service?: 'gemini' | 'youtube' | 'instagram';
          requests_made?: number;
          window_start?: string;
          window_end?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      video_status: VideoStatus;
    };
  };
}

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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
