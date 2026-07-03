import type { WhisperWord, GeminiResponse } from '../types';
export declare class AIService {
    private genAI;
    private model;
    private apiKey;
    private initialized;
    constructor(apiKey?: string);
    private init;
    setApiKey(apiKey: string): void;
    generateScript(topic: string, videoContext?: string): Promise<GeminiResponse>;
    generateMetadata(script: string, topic?: string): Promise<{
        title: string;
        hashtags: string[];
    }>;
}
export declare class TTSService {
    private tempDir;
    constructor(tempDir?: string);
    generateSpeech(text: string, voice?: string, outputPath?: string): Promise<string>;
    getAvailableVoices(language?: string): Promise<string[]>;
}
export declare class WhisperService {
    private tempDir;
    private modelPath?;
    constructor(tempDir?: string, modelPath?: string);
    transcribeWithTimestamps(_audioPath: string): Promise<WhisperWord[]>;
    fallbackWordTimestamps(text: string, audioDurationMs: number): Promise<WhisperWord[]>;
}
export declare const aiService: AIService;
export declare const ttsService: TTSService;
export declare const whisperService: WhisperService;
//# sourceMappingURL=ai.d.ts.map