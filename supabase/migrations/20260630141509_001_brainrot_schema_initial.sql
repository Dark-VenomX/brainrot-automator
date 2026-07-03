/*
# Brainrot Video Automator - Initial Schema

## Overview
Complete database schema for a multi-tenant SaaS video automation platform.
Supports multiple YouTube and Instagram account linking per user.

## New Tables

### 1. profiles
- `id` (uuid, primary key, references auth.users)
- `email` (text, unique)
- `full_name` (text, optional)
- `avatar_url` (text, optional)
- `gemini_api_key` (text, encrypted, for user's own Gemini API)
- `plan` (text, default 'free')
- `created_at`, `updated_at` (timestamps)

### 2. social_accounts
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `platform` (text enum: 'youtube' | 'instagram')
- `platform_user_id` (text, the external platform's user ID)
- `platform_username` (text, display name on platform)
- `access_token` (text, encrypted OAuth token)
- `refresh_token` (text, encrypted refresh token)
- `token_expires_at` (timestamptz)
- `account_metadata` (jsonb, platform-specific data)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

### 3. video_queue
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `source_url` (text, original video URL)
- `start_timestamp` (text, format "MM:SS" or seconds)
- `end_timestamp` (text, format "MM:SS" or seconds)
- `topic_input` (text, user's topic/prompt)
- `generated_script` (text, AI-generated script)
- `script_language` (text, default 'en')
- `voice_name` (text, TTS voice selection)
- `output_video_path` (text, path to generated video)
- `output_audio_path` (text, path to TTS audio)
- `subtitle_path` (text, path to .ass file)
- `target_account_ids` (uuid[], array of social_accounts to post to)
- `status` (text enum: pending, downloading, processing, generating_script, creating_tts, rendering, ready, scheduled, posted, failed)
- `error_message` (text, if status is failed)
- `processing_progress` (integer, 0-100)
- `scheduled_for` (timestamptz, when to post)
- `posted_at` (timestamptz, when actually posted)
- `platform_post_ids` (jsonb, platform-specific post IDs)
- `auto_generated_title` (text, AI-generated video title)
- `auto_generated_hashtags` (text[], AI-generated hashtags)
- `metadata` (jsonb, additional processing data)
- `created_at`, `updated_at` (timestamps)

### 4. processing_jobs
- `id` (uuid, primary key)
- `video_queue_id` (uuid, references video_queue)
- `job_type` (text: 'download', 'script', 'tts', 'subtitle', 'render', 'post')
- `status` (text: 'pending', 'running', 'completed', 'failed')
- `started_at`, `completed_at` (timestamps)
- `error_details` (text)
- `retry_count` (integer, default 0)

### 5. api_rate_limits
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `service` (text: 'gemini', 'youtube', 'instagram')
- `requests_made` (integer)
- `window_start` (timestamptz)
- `window_end` (timestamptz)

## Security
- RLS enabled on all tables
- Owner-scoped CRUD for user data
- Social accounts are user-scoped
- Video queue is user-scoped
*/

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  gemini_api_key text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Social Accounts table (Multi-account matrix support)
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  account_metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Enable RLS on social_accounts
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Social accounts policies
DROP POLICY IF EXISTS "select_own_accounts" ON social_accounts;
CREATE POLICY "select_own_accounts" ON social_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_accounts" ON social_accounts;
CREATE POLICY "insert_own_accounts" ON social_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_accounts" ON social_accounts;
CREATE POLICY "update_own_accounts" ON social_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_accounts" ON social_accounts;
CREATE POLICY "delete_own_accounts" ON social_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Video Queue table (Main processing pipeline)
CREATE TABLE IF NOT EXISTS video_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  start_timestamp text DEFAULT '00:00',
  end_timestamp text DEFAULT '00:45',
  topic_input text,
  generated_script text,
  script_language text DEFAULT 'en',
  voice_name text DEFAULT 'en-US-AriaNeural',
  output_video_path text,
  output_audio_path text,
  subtitle_path text,
  target_account_ids uuid[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'downloading', 'processing', 'generating_script',
    'creating_tts', 'rendering', 'ready', 'scheduled', 'posted', 'failed'
  )),
  error_message text,
  processing_progress integer DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
  scheduled_for timestamptz,
  posted_at timestamptz,
  platform_post_ids jsonb DEFAULT '{}',
  auto_generated_title text,
  auto_generated_hashtags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on video_queue
ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;

-- Video queue policies
DROP POLICY IF EXISTS "select_own_videos" ON video_queue;
CREATE POLICY "select_own_videos" ON video_queue FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_videos" ON video_queue;
CREATE POLICY "insert_own_videos" ON video_queue FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_videos" ON video_queue;
CREATE POLICY "update_own_videos" ON video_queue FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_videos" ON video_queue;
CREATE POLICY "delete_own_videos" ON video_queue FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Processing Jobs table (Track individual processing steps)
CREATE TABLE IF NOT EXISTS processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_queue_id uuid NOT NULL REFERENCES video_queue(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('download', 'script', 'tts', 'subtitle', 'render', 'post')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_details text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on processing_jobs
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Processing jobs policies ( cascade from video_queue ownership)
DROP POLICY IF EXISTS "select_own_jobs" ON processing_jobs;
CREATE POLICY "select_own_jobs" ON processing_jobs FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM video_queue
      WHERE video_queue.id = processing_jobs.video_queue_id
      AND video_queue.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_jobs" ON processing_jobs;
CREATE POLICY "insert_own_jobs" ON processing_jobs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_queue
      WHERE video_queue.id = processing_jobs.video_queue_id
      AND video_queue.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_jobs" ON processing_jobs;
CREATE POLICY "update_own_jobs" ON processing_jobs FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM video_queue
      WHERE video_queue.id = processing_jobs.video_queue_id
      AND video_queue.user_id = auth.uid()
    )
  );

-- API Rate Limits table (Track free tier limits)
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  service text NOT NULL CHECK (service IN ('gemini', 'youtube', 'instagram')),
  requests_made integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  window_end timestamptz,
  UNIQUE(user_id, service)
);

-- Enable RLS on api_rate_limits
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- API rate limits policies
DROP POLICY IF EXISTS "select_own_limits" ON api_rate_limits;
CREATE POLICY "select_own_limits" ON api_rate_limits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_limits" ON api_rate_limits;
CREATE POLICY "insert_own_limits" ON api_rate_limits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_limits" ON api_rate_limits;
CREATE POLICY "update_own_limits" ON api_rate_limits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_queue_user_status ON video_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_video_queue_scheduled ON video_queue(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_video ON processing_jobs(video_queue_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(user_id, service, window_end);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_video_queue_updated_at ON video_queue;
CREATE TRIGGER update_video_queue_updated_at
  BEFORE UPDATE ON video_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Notify function for video processing (can be used with realtime)
CREATE OR REPLACE FUNCTION public.notify_video_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify(
    'video_status_changes',
    json_build_object(
      'id', NEW.id,
      'status', NEW.status,
      'progress', NEW.processing_progress,
      'user_id', NEW.user_id
    )::text
  );
  RETURN NEW;
END;
$$;

-- Trigger for video status notifications
DROP TRIGGER IF EXISTS on_video_status_change ON video_queue;
CREATE TRIGGER on_video_status_change
  AFTER UPDATE OF status, processing_progress ON video_queue
  FOR EACH ROW EXECUTE FUNCTION public.notify_video_status_change();
