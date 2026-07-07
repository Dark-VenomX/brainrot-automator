import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { WhisperWord, GeminiResponse } from '../types';
import logger from '../utils/logger';

const execAsync = promisify(exec);

const GEMINI_RPM_LIMIT = 15;
const GEMINI_WINDOW_MS = 60 * 1000;

let requestTimestamps: number[] = [];

function cleanOldTimestamps(): void {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(ts => now - ts < GEMINI_WINDOW_MS);
}

async function waitForRateLimit(): Promise<void> {
  cleanOldTimestamps();
  if (requestTimestamps.length >= GEMINI_RPM_LIMIT) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = GEMINI_WINDOW_MS - (Date.now() - oldestRequest) + 100;
    logger.info(`Rate limit reached. Waiting ${waitTime}ms before next Gemini request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    cleanOldTimestamps();
  }
  requestTimestamps.push(Date.now());
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string;
  private initialized = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (this.apiKey) {
      this.init();
    }
  }

  private init(): void {
    if (this.initialized) return;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.initialized = true;
    logger.info('Gemini AI service initialized');
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initialized = false;
    this.init();
  }

  async generateScript(topic: string, videoContext?: string, niche: string = 'General', aspectRatio: string = '9:16'): Promise<GeminiResponse> {
    if (!this.model) this.init();
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

    try {
      const result = await this.model!.generateContent([
        { text: systemPrompt },
        { text: `Write a script about: ${topic}` },
      ]);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        logger.info(`Generated script for topic: ${topic}`);
        return parsed;
      }
      throw new Error('Could not parse Gemini response as JSON');
    } catch (error) {
      logger.error(`Script generation failed: ${error}`);
      throw error;
    }
  }

  async generateMetadata(script: string, topic?: string): Promise<{ title: string; hashtags: string[] }> {
    if (!this.model) this.init();
    await waitForRateLimit();

    const prompt = `Given this video script, generate a catchy title (under 60 characters) and exactly 3 relevant hashtags.

Script: "${script}"
${topic ? `Topic: ${topic}` : ''}

Respond with ONLY this JSON format:
{
  "title": "Your title here",
  "hashtags": ["tag1", "tag2", "tag3"]
}`;

    try {
      const result = await this.model!.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { title: topic || 'Check this out!', hashtags: ['viral', 'trending', 'fyp'] };
    } catch (error) {
      logger.error(`Metadata generation failed: ${error}`);
      return { title: topic || 'Check this out!', hashtags: ['viral', 'trending', 'fyp'] };
    }
  }
}

export class TTSService {
  private tempDir: string;

  constructor(tempDir?: string) {
    this.tempDir = tempDir || process.env.TEMP_DIR || path.join(process.cwd(), 'temp');
  }

  async generateSpeech(
    text: string,
    voice: string = 'en-US-AriaNeural',
    outputPath?: string,
  ): Promise<string> {
    // STUB: edge-tts CLI is not installed in this preview environment.
    // When deploying with Docker, the real implementation uses:
    //   edge-tts --voice "..." --text "..." --write-to "..."
    const cleanText = text.replace(/["\u201c\u201d]/g, '').replace(/['\u2018\u2019]/g, '').trim();
    const outputFile = path.resolve(outputPath || path.join(this.tempDir, `tts_${Date.now()}.mp3`));
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    // Write a placeholder file so downstream code can detect it
    await fs.writeFile(outputFile, Buffer.from('TTS_STUB'));
    logger.warn(`[STUB] TTS generated placeholder: ${outputFile}`);
    return outputFile;
  }

  async getAvailableVoices(language: string = 'en'): Promise<string[]> {
    return [
      'en-US-AriaNeural',
      'en-US-GuyNeural',
      'en-GB-SoniaNeural',
      'en-AU-NatashaNeural',
    ];
  }
}

export class WhisperService {
  private tempDir: string;
  private modelPath?: string;

  constructor(tempDir?: string, modelPath?: string) {
    this.tempDir = tempDir || process.env.TEMP_DIR || path.join(process.cwd(), 'temp');
    this.modelPath = modelPath;
  }

  async transcribeWithTimestamps(_audioPath: string): Promise<WhisperWord[]> {
    // STUB: whisper CLI is not installed in this preview environment.
    throw new Error('Whisper transcription is not available in this preview environment.');
  }

  async fallbackWordTimestamps(text: string, audioDurationMs: number): Promise<WhisperWord[]> {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordDuration = audioDurationMs / Math.max(words.length, 1);
    return words.map((word, idx) => ({
      word: word.trim(),
      start: Math.round(idx * wordDuration),
      end: Math.round((idx + 1) * wordDuration),
    }));
  }
}

export const aiService = new AIService();
export const ttsService = new TTSService();
export const whisperService = new WhisperService();
