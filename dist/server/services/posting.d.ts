import type { PlatformPostResult, SocialAccount } from '../types';
export declare class PostingService {
    postToYouTube(_account: SocialAccount, _videoPath: string, _title: string, _description: string, _tags: string[]): Promise<PlatformPostResult>;
    postToInstagram(_account: SocialAccount, _videoPath: string, _caption: string, _hashtags: string[]): Promise<PlatformPostResult>;
    postToAllPlatforms(accounts: SocialAccount[], _videoPath: string, _title: string, _description: string, _hashtags: string[]): Promise<PlatformPostResult[]>;
    mockPostToYouTube(account: SocialAccount, _title: string): Promise<PlatformPostResult>;
    mockPostToInstagram(account: SocialAccount, _title: string): Promise<PlatformPostResult>;
    mockPostToAllPlatforms(accounts: SocialAccount[], title: string): Promise<PlatformPostResult[]>;
}
export declare const postingService: PostingService;
//# sourceMappingURL=posting.d.ts.map