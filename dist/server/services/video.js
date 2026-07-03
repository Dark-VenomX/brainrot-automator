"use strict";
// TEMPORARY STUB — native video deps (fluent-ffmpeg, yt-dlp) are not
// installed in this preview environment. All methods throw a clear error
// so the frontend can compile and run. Restore the real implementation
// (see git history) when deploying with the full Docker stack.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoService = exports.VideoService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const STUB_MSG = 'Video processing is not available in this preview environment. ' +
    'Run the full Docker stack (Dockerfile) with fluent-ffmpeg and yt-dlp installed.';
class VideoService {
    constructor(tempDir, outputDir) {
        this.tempDir = tempDir || process.env.TEMP_DIR || path_1.default.join(process.cwd(), 'temp');
        this.outputDir = outputDir || process.env.OUTPUT_DIR || path_1.default.join(process.cwd(), 'outputs');
    }
    parseTimestamp(timestamp) {
        if (/^\d+$/.test(timestamp))
            return parseInt(timestamp, 10);
        const parts = timestamp.split(':').map(p => parseInt(p, 10));
        if (parts.length === 2)
            return parts[0] * 60 + parts[1];
        if (parts.length === 3)
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    }
    async getVideoInfo(_url) {
        throw new Error(STUB_MSG);
    }
    async downloadSegment(_url, _startTime, _endTime, _outputFilename) {
        throw new Error(STUB_MSG);
    }
    async clipVideo(_inputPath, _startSeconds, _durationSeconds, _outputPath) {
        throw new Error(STUB_MSG);
    }
    async getLocalVideoInfo(_inputPath) {
        throw new Error(STUB_MSG);
    }
    needsSmartCrop(width, height) {
        const aspectRatio = width / height;
        return aspectRatio > 1.3;
    }
    generateASSSubtitle(words, _outputPath) {
        const header = `[Script Info]
Title: Brainrot Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Brainrot,TheBoldFont,52,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,5,3,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
        const events = [];
        words.forEach((word) => {
            const startMs = word.start;
            const endMs = word.end;
            const startH = Math.floor(startMs / 3600000);
            const startM = Math.floor((startMs % 3600000) / 60000);
            const startS = Math.floor((startMs % 60000) / 1000);
            const startCs = Math.floor((startMs % 1000) / 10);
            const endH = Math.floor(endMs / 3600000);
            const endM = Math.floor((endMs % 3600000) / 60000);
            const endS = Math.floor((endMs % 60000) / 1000);
            const endCs = Math.floor((endMs % 1000) / 10);
            const startTime = `${startH}:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}.${String(startCs).padStart(2, '0')}`;
            const endTime = `${endH}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}.${String(endCs).padStart(2, '0')}`;
            const escapedWord = word.word.replace(/[{}\\]/g, '\\$&');
            events.push(`Dialogue: 0,${startTime},${endTime},Brainrot,,0,0,0,,{\\kf100}${escapedWord}`);
        });
        return `${header}\n${events.join('\n')}`;
    }
    async writeASSSubtitle(words, outputPath) {
        const subtitlePath = outputPath || path_1.default.join(this.tempDir, `subs_${Date.now()}.ass`);
        const content = this.generateASSSubtitle(words, subtitlePath);
        await promises_1.default.mkdir(path_1.default.dirname(subtitlePath), { recursive: true });
        await promises_1.default.writeFile(subtitlePath, content, 'utf8');
        logger_1.default.info(`Generated ASS subtitle: ${subtitlePath}`);
        return subtitlePath;
    }
    async renderFinalVideo(_videoPath, _audioPath, _subtitlePath, _outputPath, _backgroundVolume = 0.1, _voiceVolume = 1.0) {
        throw new Error(STUB_MSG);
    }
    async getAudioDuration(_audioPath) {
        throw new Error(STUB_MSG);
    }
    async cleanupFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                await promises_1.default.unlink(filePath);
            }
            catch { }
        }
        logger_1.default.info('Cleaned up temporary files');
    }
}
exports.VideoService = VideoService;
exports.videoService = new VideoService();
//# sourceMappingURL=video.js.map