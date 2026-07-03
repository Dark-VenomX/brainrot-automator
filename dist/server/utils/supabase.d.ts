import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabaseAdmin: SupabaseClient;
export declare const supabaseClient: SupabaseClient<any, "public", "public", any, any>;
export declare function createUserClient(accessToken: string): SupabaseClient;
export declare const TABLES: {
    readonly PROFILES: "profiles";
    readonly SOCIAL_ACCOUNTS: "social_accounts";
    readonly VIDEO_QUEUE: "video_queue";
    readonly PROCESSING_JOBS: "processing_jobs";
    readonly API_RATE_LIMITS: "api_rate_limits";
};
//# sourceMappingURL=supabase.d.ts.map