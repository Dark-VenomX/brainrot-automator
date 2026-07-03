"use strict";
// TEMPORARY STUB — googleapis and axios are not installed in this
// preview environment. Live posting methods throw; mock (sandbox)
// methods still work since they're pure logic. Restore the real
// implementation when deploying with the full Docker stack.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postingService = exports.PostingService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const STUB_MSG = 'Live posting is not available in this preview environment. ' +
    'Enable Sandbox Test Mode to simulate posts, or deploy with the full Docker stack.';
class PostingService {
    // =====================
    // LIVE posting methods (STUBBED)
    // =====================
    async postToYouTube(_account, _videoPath, _title, _description, _tags) {
        logger_1.default.warn(`[STUB] Live YouTube posting attempted — returning error`);
        return { platform: 'youtube', success: false, error: STUB_MSG };
    }
    async postToInstagram(_account, _videoPath, _caption, _hashtags) {
        logger_1.default.warn(`[STUB] Live Instagram posting attempted — returning error`);
        return { platform: 'instagram', success: false, error: STUB_MSG };
    }
    async postToAllPlatforms(accounts, _videoPath, _title, _description, _hashtags) {
        return accounts.map(account => ({
            platform: account.platform,
            success: false,
            error: STUB_MSG,
        }));
    }
    // =====================
    // MOCK (sandbox) posting methods — these work without external deps
    // =====================
    async mockPostToYouTube(account, _title) {
        const fakeId = `sandbox_yt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const fakeUrl = `https://www.youtube.com/watch?v=${fakeId}`;
        logger_1.default.info(`[SANDBOX] Simulated YouTube post for account ${account.id} (${account.platform_username || 'channel'}) → ${fakeUrl}`);
        return { platform: 'youtube', success: true, postId: fakeId };
    }
    async mockPostToInstagram(account, _title) {
        const fakeId = `sandbox_ig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const fakeUrl = `https://www.instagram.com/reel/${fakeId}/`;
        logger_1.default.info(`[SANDBOX] Simulated Instagram post for account ${account.id} (${account.platform_username || 'account'}) → ${fakeUrl}`);
        return { platform: 'instagram', success: true, postId: fakeId };
    }
    async mockPostToAllPlatforms(accounts, title) {
        const results = [];
        for (const account of accounts) {
            let result;
            if (account.platform === 'youtube') {
                result = await this.mockPostToYouTube(account, title);
            }
            else if (account.platform === 'instagram') {
                result = await this.mockPostToInstagram(account, title);
            }
            else {
                result = { platform: account.platform, success: false, error: 'Unsupported platform' };
            }
            results.push(result);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return results;
    }
}
exports.PostingService = PostingService;
exports.postingService = new PostingService();
//# sourceMappingURL=posting.js.map