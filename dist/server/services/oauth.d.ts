import type { Platform, AuthTokens, SocialAccount } from '../types';
export declare class OAuthService {
    getYouTubeAuthUrl(state: string): string;
    handleYouTubeCallback(code: string): Promise<AuthTokens>;
    getYouTubeChannelInfo(accessToken: string): Promise<{
        id: string;
        title: string;
        thumbnailUrl: string;
    }>;
    refreshYouTubeToken(refreshToken: string): Promise<AuthTokens>;
    getInstagramAuthUrl(state: string): string;
    handleInstagramCallback(code: string): Promise<AuthTokens>;
    getInstagramAccountInfo(accessToken: string): Promise<{
        id: string;
        username: string;
    }>;
    linkAccount(userId: string, platform: Platform, platformUserId: string, platformUsername: string, tokens: AuthTokens, metadata?: Record<string, unknown>): Promise<SocialAccount>;
    getUserAccounts(userId: string): Promise<SocialAccount[]>;
    unlinkAccount(userId: string, accountId: string): Promise<void>;
    getValidAccessToken(account: SocialAccount): Promise<string>;
}
export declare const oauthService: OAuthService;
//# sourceMappingURL=oauth.d.ts.map