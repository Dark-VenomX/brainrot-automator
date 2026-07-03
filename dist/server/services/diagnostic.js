"use strict";
// TEMPORARY STUB — the diagnostic endpoint depends on video processing
// (yt-dlp, FFmpeg) which is not available in this preview environment.
// The endpoint returns a clear error message instead of crashing.
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosticService = exports.DiagnosticService = void 0;
const ai_1 = require("./ai");
const video_1 = require("./video");
const DEFAULT_TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const DEFAULT_START = '00:30';
const DEFAULT_END = '01:15';
const DEFAULT_TOPIC = 'Insane speedrun tricks that broke the game';
class DiagnosticService {
    async runTestRender(opts) {
        const url = opts?.url || DEFAULT_TEST_URL;
        const start = opts?.start || DEFAULT_START;
        const end = opts?.end || DEFAULT_END;
        const topic = opts?.topic || DEFAULT_TOPIC;
        const steps = [];
        // Step 1: Download — will fail in preview (yt-dlp not installed)
        try {
            await video_1.videoService.downloadSegment(url, start, end);
            steps.push({ step: 'download', ok: true });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            steps.push({ step: 'download', ok: false, detail: msg });
        }
        // Step 2: AI script — works if Gemini API key is configured
        let script = '';
        let title = '';
        let hashtags = [];
        try {
            const geminiRes = await ai_1.aiService.generateScript(topic, `Source: ${url}`);
            script = geminiRes.script;
            title = geminiRes.title;
            hashtags = geminiRes.hashtags;
            steps.push({ step: 'script', ok: true, detail: `${script.split(/\s+/).length} words` });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            steps.push({ step: 'script', ok: false, detail: msg });
        }
        // Step 3: TTS — stubbed in preview
        try {
            await ai_1.ttsService.generateSpeech(script || 'test', 'en-US-AriaNeural');
            steps.push({ step: 'tts', ok: true, detail: 'stub placeholder' });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            steps.push({ step: 'tts', ok: false, detail: msg });
        }
        // Step 4: Whisper — stubbed in preview
        try {
            await ai_1.whisperService.transcribeWithTimestamps('stub');
            steps.push({ step: 'whisper', ok: true });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            steps.push({ step: 'whisper', ok: false, detail: msg });
        }
        // Step 5: Render — will fail in preview (FFmpeg not installed)
        try {
            await video_1.videoService.renderFinalVideo('stub', 'stub', 'stub');
            steps.push({ step: 'render', ok: true });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            steps.push({ step: 'render', ok: false, detail: msg });
        }
        const downloadOk = steps.find(s => s.step === 'download')?.ok ?? false;
        const renderOk = steps.find(s => s.step === 'render')?.ok ?? false;
        if (!downloadOk || !renderOk) {
            return {
                ok: false,
                output_path: '',
                script,
                title,
                hashtags,
                word_count: 0,
                audio_duration_ms: 0,
                video_info: { width: 0, height: 0, duration: 0, fps: 0, smart_cropped: false },
                steps,
                error: 'Video processing is not available in this preview environment. ' +
                    'Deploy with the full Docker stack to run the diagnostic render.',
            };
        }
        return {
            ok: true,
            output_path: '',
            script,
            title,
            hashtags,
            word_count: 0,
            audio_duration_ms: 0,
            video_info: { width: 0, height: 0, duration: 0, fps: 0, smart_cropped: false },
            steps,
        };
    }
}
exports.DiagnosticService = DiagnosticService;
exports.diagnosticService = new DiagnosticService();
//# sourceMappingURL=diagnostic.js.map