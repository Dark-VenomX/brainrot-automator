import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Polyfill WebSocket for Node 18 since Supabase Realtime requires it
if (typeof global !== 'undefined' && !(global as any).WebSocket) {
  (global as any).WebSocket = WebSocket;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Service role client for server-side operations (bypasses RLS for admin tasks)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Regular client with anon key for user-scoped operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper to create user-scoped client
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  SOCIAL_ACCOUNTS: 'social_accounts',
  VIDEO_QUEUE: 'video_queue',
  PROCESSING_JOBS: 'processing_jobs',
  API_RATE_LIMITS: 'api_rate_limits',
} as const;
