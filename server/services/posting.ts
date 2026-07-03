// TEMPORARY STUB — googleapis and axios are not installed in this
// preview environment. Live posting methods throw; mock (sandbox)
// methods still work since they're pure logic. Restore the real
// implementation when deploying with the full Docker stack.

import type { Platform, PlatformPostResult, SocialAccount } from '../types';
import { oauthService } from './oauth';
import logger from '../utils/logger';

const STUB_MSG =
  'Live posting is not available in this preview environment. ' +
  'Enable Sandbox Test Mode to simulate posts, or deploy with the full Docker stack.';

export class PostingService {
  // =====================
  // LIVE posting methods (STUBBED)
  // =====================

  async postToYouTube(
    _account: SocialAccount,
    _videoPath: string,
    _title: string,
    _description: string,
    _tags: string[],
  ): Promise<PlatformPostResult> {
    logger.warn(`[STUB] Live YouTube posting attempted — returning error`);
    return { platform: 'youtube', success: false, error: STUB_MSG };
  }

  async postToInstagram(
    _account: SocialAccount,
    _videoPath: string,
    _caption: string,
    _hashtags: string[],
  ): Promise<PlatformPostResult> {
    logger.warn(`[STUB] Live Instagram posting attempted — returning error`);
    return { platform: 'instagram', success: false, error: STUB_MSG };
  }

  async postToAllPlatforms(
    accounts: SocialAccount[],
    _videoPath: string,
    _title: string,
    _description: string,
    _hashtags: string[],
  ): Promise<PlatformPostResult[]> {
    return accounts.map(account => ({
      platform: account.platform as Platform,
      success: false,
      error: STUB_MSG,
    }));
  }

  // =====================
  // MOCK (sandbox) posting methods — these work without external deps
  // =====================

  async mockPostToYouTube(
    account: SocialAccount,
    _title: string,
  ): Promise<PlatformPostResult> {
    const fakeId = `sandbox_yt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fakeUrl = `https://www.youtube.com/watch?v=${fakeId}`;
    logger.info(
      `[SANDBOX] Simulated YouTube post for account ${account.id} (${account.platform_username || 'channel'}) → ${fakeUrl}`,
    );
    return { platform: 'youtube', success: true, postId: fakeId };
  }

  async mockPostToInstagram(
    account: SocialAccount,
    _title: string,
  ): Promise<PlatformPostResult> {
    const fakeId = `sandbox_ig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fakeUrl = `https://www.instagram.com/reel/${fakeId}/`;
    logger.info(
      `[SANDBOX] Simulated Instagram post for account ${account.id} (${account.platform_username || 'account'}) → ${fakeUrl}`,
    );
    return { platform: 'instagram', success: true, postId: fakeId };
  }

  async mockPostToAllPlatforms(
    accounts: SocialAccount[],
    title: string,
  ): Promise<PlatformPostResult[]> {
    const results: PlatformPostResult[] = [];
    for (const account of accounts) {
      let result: PlatformPostResult;
      if (account.platform === 'youtube') {
        result = await this.mockPostToYouTube(account, title);
      } else if (account.platform === 'instagram') {
        result = await this.mockPostToInstagram(account, title);
      } else {
        result = { platform: account.platform as Platform, success: false, error: 'Unsupported platform' };
      }
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return results;
  }
}

export const postingService = new PostingService();
