import { google } from 'googleapis';
import axios from 'axios';
import type { Platform, AuthTokens, SocialAccount } from '../types';
import { supabaseAdmin, TABLES } from '../utils/supabase';
import logger from '../utils/logger';

const getYouTubeClient = () => {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
};

export class OAuthService {
  getYouTubeAuthUrl(state: string): string {
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

  async handleYouTubeCallback(code: string): Promise<AuthTokens> {
    const oauth2Client = getYouTubeClient();
    const { tokens } = await oauth2Client.getToken(code);
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    };
  }

  async getYouTubeChannelInfo(accessToken: string): Promise<{ id: string; title: string; thumbnailUrl: string }> {
    const oauth2Client = getYouTubeClient();
    oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });

    const channel = response.data.items?.[0];
    if (!channel) throw new Error('No YouTube channel found');

    return {
      id: channel.id!,
      title: channel.snippet?.title || 'Unknown Channel',
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url || ''
    };
  }

  async refreshYouTubeToken(refreshToken: string): Promise<AuthTokens> {
    const oauth2Client = getYouTubeClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || refreshToken,
      expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
    };
  }

  getInstagramAuthUrl(state: string): string {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    if (!clientId || clientId === 'your_instagram_app_id') {
      logger.warn('Instagram App ID is missing or using placeholder');
    }
    return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&response_type=code&scope=instagram_basic,instagram_content_publish&state=${state}`;
  }

  async handleInstagramCallback(code: string): Promise<AuthTokens> {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const clientSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    const form = new URLSearchParams();
    form.append('client_id', clientId!);
    form.append('client_secret', clientSecret!);
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', redirectUri!);
    form.append('code', code);

    const response = await axios.post('https://api.instagram.com/oauth/access_token', form);
    
    // Exchange for long-lived token (optional but recommended)
    try {
      const longLivedRes = await axios.get(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${response.data.access_token}`);
      return {
        access_token: longLivedRes.data.access_token,
        refresh_token: undefined,
        expires_in: longLivedRes.data.expires_in
      };
    } catch (e) {
      logger.warn(`Failed to exchange for long-lived token, falling back to short-lived: ${e}`);
      return {
        access_token: response.data.access_token,
        refresh_token: undefined,
        expires_in: undefined
      };
    }
  }

  async getInstagramAccountInfo(accessToken: string): Promise<{ id: string; username: string }> {
    const response = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    return {
      id: response.data.id,
      username: response.data.username
    };
  }

  async linkAccount(
    userId: string,
    platform: Platform,
    platformUserId: string,
    platformUsername: string,
    tokens: AuthTokens,
    metadata: Record<string, unknown> = {},
  ): Promise<SocialAccount> {
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const { data, error } = await supabaseAdmin
      .from(TABLES.SOCIAL_ACCOUNTS)
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
      logger.error(`Failed to link ${platform} account: ${error.message}`);
      throw error;
    }

    logger.info(`Linked ${platform} account for user ${userId}`);
    return data as SocialAccount;
  }

  async getUserAccounts(userId: string): Promise<SocialAccount[]> {
    const { data, error } = await supabaseAdmin
      .from(TABLES.SOCIAL_ACCOUNTS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    return (data as SocialAccount[]).map(account => ({
      ...account,
      access_token: '***redacted***',
      refresh_token: account.refresh_token ? '***redacted***' : null,
    }));
  }

  async unlinkAccount(userId: string, accountId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(TABLES.SOCIAL_ACCOUNTS)
      .update({ is_active: false })
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) throw error;
    logger.info(`Unlinked account ${accountId} for user ${userId}`);
  }

  async getValidAccessToken(account: SocialAccount): Promise<string> {
    return account.access_token;
  }
}

export const oauthService = new OAuthService();
