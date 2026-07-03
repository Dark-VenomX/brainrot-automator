"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoService = exports.VideoService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const ffprobe_1 = __importDefault(require("@ffprobe-installer/ffprobe"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const logger_1 = __importDefault(require("../utils/logger"));
const execAsync = util_1.default.promisify(child_process_1.exec);
// Use yt-dlp from PATH since it's installed globally via pip in Docker
const YT_DLP_PATH = 'yt-dlp';
// Set paths for ffmpeg and ffprobe
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
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
    async getVideoInfo(url) {
        try {
            const cookiesArg = (await promises_1.default.stat('cookies.txt').then(() => true).catch(() => false)) ? '--cookies cookies.txt' : '';
            const command = `${YT_DLP_PATH} --dump-json --no-warnings --no-check-certificate --youtube-skip-dash-manifest ${cookiesArg} --extractor-args "youtube:player_client=android,ios,web" "${url}"`;
            const { stdout } = await execAsync(command);
            const info = JSON.parse(stdout);
            return {
                duration: info.duration || 0,
                title: info.title,
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to get video info: ${error}`);
            throw error;
        }
    }
    async downloadSegment(url, startTime, endTime, outputFilename) {
        const outputPath = outputFilename || path_1.default.join(this.tempDir, `segment_${Date.now()}.mp4`);
        await promises_1.default.mkdir(path_1.default.dirname(outputPath), { recursive: true });
        try {
            logger_1.default.info(`Downloading segment from ${url} (${startTime} to ${endTime})`);
            const cookiesArg = (await promises_1.default.stat('cookies.txt').then(() => true).catch(() => false)) ? '--cookies cookies.txt' : '';
            const command = `${YT_DLP_PATH} --download-sections "*${startTime}-${endTime}" -o "${outputPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --force-keyframes-at-cuts --no-warnings --no-check-certificate ${cookiesArg} --extractor-args "youtube:player_client=android,ios,web" "${url}"`;
            await execAsync(command);
            return outputPath;
        }
        catch (error) {
            logger_1.default.error(`Failed to download segment: ${error}`);
            throw error;
        }
    }
    async clipVideo(inputPath, startSeconds, durationSeconds, outputPath) {
        const finalPath = outputPath || path_1.default.join(this.tempDir, `clipped_${Date.now()}.mp4`);
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(inputPath)
                .setStartTime(startSeconds)
                .setDuration(durationSeconds)
                .outputOptions('-c:v copy')
                .outputOptions('-c:a copy')
                .save(finalPath)
                .on('end', () => resolve(finalPath))
                .on('error', (err) => reject(err));
        });
    }
    async getLocalVideoInfo(inputPath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
                if (err)
                    return reject(err);
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                if (!videoStream)
                    return reject(new Error('No video stream found'));
                // Calculate fps from r_frame_rate (e.g., "30000/1001")
                let fps = 30;
                if (videoStream.r_frame_rate) {
                    const [num, den] = videoStream.r_frame_rate.split('/');
                    if (num && den)
                        fps = parseInt(num) / parseInt(den);
                }
                resolve({
                    width: videoStream.width || 1920,
                    height: videoStream.height || 1080,
                    duration: metadata.format.duration || 0,
                    fps
                });
            });
        });
    }
    needsSmartCrop(width, height) {
        const aspectRatio = width / height;
        // If aspect ratio is wider than 1.3 (like 16:9), it needs cropping to 9:16
        return aspectRatio > 1.3;
    }
    generateASSSubtitle(words, outputPath) {
        const header = `[Script Info]
Title: Brainrot Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Brainrot,Arial,20,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,1,5,10,10,30,1

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
            const escapedWord = word.word.replace(/[{}\\\]]/g, '\\$&');
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
    async renderFinalVideo(videoPath, audioPath, subtitlePath, outputPath, backgroundVolume = 0.1, voiceVolume = 1.0) {
        const finalPath = outputPath || path_1.default.join(this.outputDir, `final_${Date.now()}.mp4`);
        await promises_1.default.mkdir(path_1.default.dirname(finalPath), { recursive: true });
        try {
            const info = await this.getLocalVideoInfo(videoPath);
            const crop = this.needsSmartCrop(info.width, info.height);
            // Escape paths for ffmpeg filters
            const escSubtitlePath = subtitlePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
            return new Promise((resolve, reject) => {
                let command = (0, fluent_ffmpeg_1.default)(videoPath)
                    .input(audioPath);
                // Build complex filter for cropping, volume, and subtitles
                let filterParts = [];
                // 1. Audio mixing
                filterParts.push(`[0:a]volume=${backgroundVolume}[bg]`);
                filterParts.push(`[1:a]volume=${voiceVolume}[vo]`);
                filterParts.push(`[bg][vo]amix=inputs=2:duration=first:dropout_transition=2[aout]`);
                // 2. Video cropping & subtitles
                let vout = '[0:v]';
                if (crop) {
                    // Crop to 9:16 aspect ratio (e.g., 1080x1920)
                    const targetW = Math.round(info.height * (9 / 16));
                    filterParts.push(`[0:v]crop=${targetW}:${info.height}:(in_w-${targetW})/2:0[cropped]`);
                    vout = '[cropped]';
                }
                // Add subtitles
                filterParts.push(`${vout}ass=${escSubtitlePath}[vout]`);
                command
                    .complexFilter(filterParts.join(';'), ['vout', 'aout'])
                    .outputOptions([
                    '-c:v libx264',
                    '-preset veryfast',
                    '-crf 23',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                    '-shortest' // Stop encoding when the shortest input ends (usually the video clip)
                ])
                    .save(finalPath)
                    .on('start', (cmdLine) => {
                    logger_1.default.info(`FFmpeg started: ${cmdLine}`);
                })
                    .on('end', () => {
                    logger_1.default.info(`Rendered final video: ${finalPath}`);
                    resolve(finalPath);
                })
                    .on('error', (err) => {
                    logger_1.default.error(`FFmpeg error: ${err.message}`);
                    reject(err);
                });
            });
        }
        catch (error) {
            logger_1.default.error(`Render failed: ${error}`);
            throw error;
        }
    }
    async getAudioDuration(audioPath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(audioPath, (err, metadata) => {
                if (err)
                    return reject(err);
                resolve(metadata.format.duration || 0);
            });
        });
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