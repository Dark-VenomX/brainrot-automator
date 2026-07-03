"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthService = exports.OAuthService = void 0;
const googleapis_1 = require("googleapis");
const axios_1 = __importDefault(require("axios"));
const supabase_1 = require("../utils/supabase");
const logger_1 = __importDefault(require("../utils/logger"));
const getYouTubeClient = () => {
    return new googleapis_1.google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, process.env.YOUTUBE_REDIRECT_URI);
};
class OAuthService {
    getYouTubeAuthUrl(state) {
        const oauth2Client = getYouTubeClient();
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube.readonly'
            ],
            state,
            prompt: 'consent'
        });
    }
    async handleYouTubeCallback(code) {
        const oauth2Client = getYouTubeClient();
        const { tokens } = await oauth2Client.getToken(code);
        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
        };
    }
    async getYouTubeChannelInfo(accessToken) {
        const oauth2Client = getYouTubeClient();
        oauth2Client.setCredentials({ access_token: accessToken });
        const youtube = googleapis_1.google.youtube({ version: 'v3', auth: oauth2Client });
        const response = await youtube.channels.list({
            part: ['snippet'],
            mine: true
        });
        const channel = response.data.items?.[0];
        if (!channel)
            throw new Error('No YouTube channel found');
        return {
            id: channel.id,
            title: channel.snippet?.title || 'Unknown Channel',
            thumbnailUrl: channel.snippet?.thumbnails?.default?.url || ''
        };
    }
    async refreshYouTubeToken(refreshToken) {
        const oauth2Client = getYouTubeClient();
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        return {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || refreshToken,
            expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
        };
    }
    getInstagramAuthUrl(state) {
        const clientId = process.env.INSTAGRAM_APP_ID;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
        if (!clientId || clientId === 'your_instagram_app_id') {
            logger_1.default.warn('Instagram App ID is missing or using placeholder');
        }
        return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=instagram_basic,instagram_content_publish&state=${state}`;
    }
    async handleInstagramCallback(code) {
        const clientId = process.env.INSTAGRAM_APP_ID;
        const clientSecret = process.env.INSTAGRAM_APP_SECRET;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
        const form = new URLSearchParams();
        form.append('client_id', clientId);
        form.append('client_secret', clientSecret);
        form.append('grant_type', 'authorization_code');
        form.append('redirect_uri', redirectUri);
        form.append('code', code);
        const response = await axios_1.default.post('https://api.instagram.com/oauth/access_token', form);
        // Exchange for long-lived token (optional but recommended)
        try {
            const longLivedRes = await axios_1.default.get(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${response.data.access_token}`);
            return {
                access_token: longLivedRes.data.access_token,
                refresh_token: undefined,
                expires_in: longLivedRes.data.expires_in
            };
        }
        catch (e) {
            logger_1.default.warn(`Failed to exchange for long-lived token, falling back to short-lived: ${e}`);
            return {
                access_token: response.data.access_token,
                refresh_token: undefined,
                expires_in: undefined
            };
        }
    }
    async getInstagramAccountInfo(accessToken) {
        const response = await axios_1.default.get(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
        return {
            id: response.data.id,
            username: response.data.username
        };
    }
    async linkAccount(userId, platform, platformUserId, platformUsername, tokens, metadata = {}) {
        const expiresAt = tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null;
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.SOCIAL_ACCOUNTS)
            .upsert({
            user_id: userId,
            platform,
            platform_user_id: platformUserId,
            platform_username: platformUsername,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            token_expires_at: expiresAt,
            account_metadata: metadata,
            is_active: true,
        }, { onConflict: 'user_id,platform,platform_user_id' })
            .select()
            .single();
        if (error) {
            logger_1.default.error(`Failed to link ${platform} account: ${error.message}`);
            throw error;
        }
        logger_1.default.info(`Linked ${platform} account for user ${userId}`);
        return data;
    }
    async getUserAccounts(userId) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.SOCIAL_ACCOUNTS)
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);
        if (error)
            throw error;
        return data.map(account => ({
            ...account,
            access_token: '***redacted***',
            refresh_token: account.refresh_token ? '***redacted***' : null,
        }));
    }
    async unlinkAccount(userId, accountId) {
        const { error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.SOCIAL_ACCOUNTS)
            .update({ is_active: false })
            .eq('id', accountId)
            .eq('user_id', userId);
        if (error)
            throw error;
        logger_1.default.info(`Unlinked account ${accountId} for user ${userId}`);
    }
    async getValidAccessToken(account) {
        return account.access_token;
    }
}
exports.OAuthService = OAuthService;
exports.oauthService = new OAuthService();
//# sourceMappingURL=oauth.js.map