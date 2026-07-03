"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLES = exports.createUserClient = exports.supabaseClient = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ws_1 = __importDefault(require("ws"));
// Polyfill WebSocket for Node 18 since Supabase Realtime requires it
if (typeof global !== 'undefined' && !global.WebSocket) {
    global.WebSocket = ws_1.default;
}
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// Service role client for server-side operations (bypasses RLS for admin tasks)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// Regular client with anon key for user-scoped operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
exports.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
// Helper to create user-scoped client
function createUserClient(accessToken) {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}
exports.createUserClient = createUserClient;
// Database table names
exports.TABLES = {
    PROFILES: 'profiles',
    SOCIAL_ACCOUNTS: 'social_accounts',
    VIDEO_QUEUE: 'video_queue',
    PROCESSING_JOBS: 'processing_jobs',
    API_RATE_LIMITS: 'api_rate_limits',
};
//# sourceMappingURL=supabase.js.map