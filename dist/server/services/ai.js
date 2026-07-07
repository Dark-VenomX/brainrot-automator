"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whisperService = exports.ttsService = exports.aiService = exports.WhisperService = exports.TTSService = exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const GEMINI_RPM_LIMIT = 15;
const GEMINI_WINDOW_MS = 60 * 1000;
let requestTimestamps = [];
function cleanOldTimestamps() {
    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(ts => now - ts < GEMINI_WINDOW_MS);
}
async function waitForRateLimit() {
    cleanOldTimestamps();
    if (requestTimestamps.length >= GEMINI_RPM_LIMIT) {
        const oldestRequest = requestTimestamps[0];
        const waitTime = GEMINI_WINDOW_MS - (Date.now() - oldestRequest) + 100;
        logger_1.default.info(`Rate limit reached. Waiting ${waitTime}ms before next Gemini request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        cleanOldTimestamps();
    }
    requestTimestamps.push(Date.now());
}
class AIService {
    constructor(apiKey) {
        this.genAI = null;
        this.models = [];
        this.initialized = false;
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
        if (this.apiKey) {
            this.init();
        }
    }
    init() {
        if (this.initialized)
            return;
        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
        this.models = [
            this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }),
            this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }),
            this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        ];
        this.initialized = true;
        logger_1.default.info('Gemini AI service initialized with fallback models');
    }
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.initialized = false;
        this.init();
    }
    async generateScript(topic, videoContext, niche = 'General', aspectRatio = '9:16') {
        if (this.models.length === 0)
            this.init();
        await waitForRateLimit();
        const targetLengthSeconds = aspectRatio === '16:9' ? 120 : 45; // Longer for horizontal
        const wordTarget = Math.round((targetLengthSeconds / 60) * 150); // ~150 wpm
        const systemPrompt = `You are an expert scriptwriter for short-form viral videos (YouTube Shorts, Instagram Reels, TikTok) and long-form YouTube.
Your scripts are designed for maximum retention and engagement, targeting the "${niche}" niche.

RULES:
1. The script MUST be exactly ${wordTarget} words to hit the ${targetLengthSeconds}-second runtime.
2. Hook the viewer in the FIRST 3 SECONDS with an aggressive, curiosity-inducing statement.
3. Use simple, conversational, "brainrot-style" language tailored to Gen-Z if appropriate for the niche.
4. Include a clear call-to-action at the end (e.g., "Subscribe for more").
5. NO emojis or special characters in the script - only plain text for the TTS engine.
6. NO questions or prompts like "Have you ever..." - make definitive, bold statements.
7. You MUST also generate a Viral Strategy (captions with emojis, exact best time to post, and hashtags).

${videoContext ? `Context from video: ${videoContext}` : ''}

OUTPUT FORMAT (respond with ONLY this JSON, no markdown):
{
  "script": "Your script here as plain text",
  "title": "A catchy title under 60 characters",
  "hashtags": ["tag1", "tag2", "tag3"],
  "viral_strategy": {
    "captions": ["Caption option 1 🤯", "Caption option 2 🔥", "Caption option 3 👀"],
    "hashtags": ["#viral", "#${niche.replace(/\s+/g, '')}"],
    "optimal_timing": "7:30 PM EST"
  }
}`;
        let lastError;
        for (const model of this.models) {
            try {
                logger_1.default.info(`Attempting script generation with model: ${model.model}`);
                const result = await model.generateContent([
                    { text: systemPrompt },
                    { text: `Write a script about: ${topic}` },
                ]);
                const response = result.response.text();
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    logger_1.default.info(`Generated script for topic: ${topic} using ${model.model}`);
                    return parsed;
                }
                throw new Error('Could not parse Gemini response as JSON');
            }
            catch (error) {
                logger_1.default.warn(`Model ${model.model} failed: ${error}`);
                lastError = error;
            }
        }
        logger_1.default.error(`All models failed for script generation. Last error: ${lastError}`);
        throw lastError;
    }
    async generateMetadata(script, topic) {
        if (this.models.length === 0)
            this.init();
        await waitForRateLimit();
        const prompt = `Given this video script, generate a catchy title (under 60 characters) and exactly 3 relevant hashtags.

Script: "${script}"
${topic ? `Topic: ${topic}` : ''}

Respond with ONLY this JSON format:
{
  "title": "Your title here",
  "hashtags": ["tag1", "tag2", "tag3"]
}`;
        for (const model of this.models) {
            try {
                const result = await model.generateContent(prompt);
                const response = result.response.text();
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch)
                    return JSON.parse(jsonMatch[0]);
            }
            catch (error) {
                logger_1.default.warn(`Model ${model.model} failed for metadata: ${error}`);
            }
        }
        logger_1.default.error(`All models failed for metadata generation.`);
        return { title: topic || 'Check this out!', hashtags: ['viral', 'trending', 'fyp'] };
    }
}
exports.AIService = AIService;
class TTSService {
    constructor(tempDir) {
        this.tempDir = tempDir || process.env.TEMP_DIR || path_1.default.join(process.cwd(), 'temp');
    }
    async generateSpeech(text, voice = 'en-US-AriaNeural', outputPath) {
        const cleanText = text.replace(/["\u201c\u201d]/g, '').replace(/['\u2018\u2019]/g, '').trim();
        const outputFile = path_1.default.resolve(outputPath || path_1.default.join(this.tempDir, `tts_${Date.now()}.mp3`));
        await promises_1.default.mkdir(path_1.default.dirname(outputFile), { recursive: true });
        try {
            const { EdgeTTS } = require('node-edge-tts');
            const tts = new EdgeTTS({
                voice: voice,
                lang: 'en-US',
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
            });
            await tts.ttsPromise(cleanText, outputFile);
            logger_1.default.info(`TTS generated successfully: ${outputFile}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to generate TTS via node-edge-tts: ${error}`);
            // Write a fallback audio file using ffmpeg so the pipeline doesn't completely crash (3 seconds of silence)
            await promises_1.default.writeFile(outputFile, Buffer.from('')); // just touch it
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);
            await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 3 -q:a 9 -acodec libmp3lame "${outputFile}"`);
        }
        return outputFile;
    }
    async getAvailableVoices(language = 'en') {
        return [
            'en-US-AriaNeural',
            'en-US-GuyNeural',
            'en-GB-SoniaNeural',
            'en-AU-NatashaNeural',
        ];
    }
}
exports.TTSService = TTSService;
class WhisperService {
    constructor(tempDir, modelPath) {
        this.tempDir = tempDir || process.env.TEMP_DIR || path_1.default.join(process.cwd(), 'temp');
        this.modelPath = modelPath;
    }
    async transcribeWithTimestamps(_audioPath) {
        // STUB: whisper CLI is not installed in this preview environment.
        throw new Error('Whisper transcription is not available in this preview environment.');
    }
    async fallbackWordTimestamps(text, audioDurationMs) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const wordDuration = audioDurationMs / Math.max(words.length, 1);
        return words.map((word, idx) => ({
            word: word.trim(),
            start: Math.round(idx * wordDuration),
            end: Math.round((idx + 1) * wordDuration),
        }));
    }
}
exports.WhisperService = WhisperService;
exports.aiService = new AIService();
exports.ttsService = new TTSService();
exports.whisperService = new WhisperService();
//# sourceMappingURL=ai.js.map