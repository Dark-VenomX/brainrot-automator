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
            const command = `${YT_DLP_PATH} --dump-json --no-warnings --no-check-certificate --youtube-skip-dash-manifest ${cookiesArg} "${url}"`;
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
            logger_1.default.info(`Downloading/Extracting segment from ${url} (${startTime} to ${endTime})`);
            // Handle local uploaded files (both MP4 and MP3)
            if (url.startsWith('file://')) {
                const localPath = url.replace('file://', '');
                const isMp3 = localPath.toLowerCase().endsWith('.mp3');
                if (isMp3) {
                    logger_1.default.info('Detected MP3 source. Extracting audio and pairing with stock background video...');
                    const tempAudioPath = path_1.default.join(this.tempDir, `temp_audio_${Date.now()}.mp3`);
                    // 1. Slice the audio
                    await execAsync(`ffmpeg -y -i "${localPath}" -ss ${startTime} -to ${endTime} -c copy "${tempAudioPath}"`);
                    // 2. Mix with stock Minecraft video (assuming stock is at public/assets/stock_minecraft.mp4)
                    // We use -shortest to make the video stop when the audio chunk stops.
                    const stockVideoPath = path_1.default.join(process.cwd(), 'public', 'assets', 'stock_minecraft.mp4');
                    // If the stock video doesn't exist, we will use a color background as fallback
                    try {
                        await promises_1.default.access(stockVideoPath);
                        await execAsync(`ffmpeg -y -stream_loop -1 -i "${stockVideoPath}" -i "${tempAudioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${outputPath}"`);
                    }
                    catch (e) {
                        // Fallback if stock video is missing: generate a black screen
                        await execAsync(`ffmpeg -y -f lavfi -i color=c=black:s=1080x1920 -i "${tempAudioPath}" -map 0:v:0 -map 1:a:0 -c:v libx264 -c:a aac -shortest "${outputPath}"`);
                    }
                    return outputPath;
                }
                else {
                    logger_1.default.info('Detected MP4 source. Extracting local video clip via ffmpeg...');
                    await execAsync(`ffmpeg -y -i "${localPath}" -ss ${startTime} -to ${endTime} -c copy "${outputPath}"`);
                    return outputPath;
                }
            }
            // Handle YouTube URLs
            const cookiesArg = (await promises_1.default.stat('cookies.txt').then(() => true).catch(() => false)) ? '--cookies cookies.txt' : '';
            const command = `${YT_DLP_PATH} --download-sections "*${startTime}-${endTime}" -o "${outputPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --force-keyframes-at-cuts --no-warnings --no-check-certificate --ffmpeg-location "${ffmpeg_1.default.path}" ${cookiesArg} "${url}"`;
            await execAsync(command);
            return outputPath;
        }
        catch (error) {
            logger_1.default.error(`Failed to download segment via yt-dlp: ${error}`);
            // If it's a YouTube bot check error or generic failure, use a stock fallback video
            if (error.message?.includes('Sign in to confirm you’re not a bot') || error.message?.includes('ERROR: [youtube]')) {
                logger_1.default.info(`YouTube bot check detected! Falling back to stock video to prevent pipeline failure.`);
                // Use a direct MP4 link of Minecraft Parkour as fallback to guarantee success
                const stockUrl = "https://cdn.pixabay.com/video/2023/10/22/185966-876722880_tiny.mp4";
                try {
                    const fallbackCommand = `${YT_DLP_PATH} -o "${outputPath}" --no-warnings --no-check-certificate "${stockUrl}"`;
                    await execAsync(fallbackCommand);
                    logger_1.default.info(`Successfully downloaded fallback stock video.`);
                    return outputPath;
                }
                catch (fallbackError) {
                    logger_1.default.error(`Fallback stock video download also failed: ${fallbackError}`);
                    throw new Error('Video download failed, and fallback stock video also failed. Please try a direct .mp4 link.');
                }
            }
            throw new Error(`Video download failed: ${error.message || 'Unknown error'}`);
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
    needsSmartCrop(width, height, targetRatio = '9:16') {
        const currentRatio = width / height;
        if (targetRatio === '9:16')
            return currentRatio > 0.6; // If it's wider than 9:16
        if (targetRatio === '16:9')
            return currentRatio < 1.7; // If it's narrower than 16:9
        return false;
    }
    generateASSSubtitle(words, outputPath, fontStyle = 'classic') {
        let styleStr = 'Style: Brainrot,Arial,20,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,1,5,10,10,30,1';
        if (fontStyle === 'mrbeast') {
            styleStr = 'Style: Brainrot,Impact,26,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,2,5,10,10,30,1';
        }
        else if (fontStyle === 'minimal') {
            styleStr = 'Style: Brainrot,Helvetica,18,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,1,5,10,10,30,1';
        }
        const header = `[Script Info]
Title: Brainrot Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleStr}

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
    async writeASSSubtitle(words, outputPath, fontStyle) {
        const subtitlePath = outputPath || path_1.default.join(this.tempDir, `subs_${Date.now()}.ass`);
        const content = this.generateASSSubtitle(words, subtitlePath, fontStyle);
        await promises_1.default.mkdir(path_1.default.dirname(subtitlePath), { recursive: true });
        await promises_1.default.writeFile(subtitlePath, content, 'utf8');
        logger_1.default.info(`Generated ASS subtitle: ${subtitlePath}`);
        return subtitlePath;
    }
    async renderFinalVideo(videoPath, audioPath, subtitlePath, outputPath, backgroundVolume = 0.1, voiceVolume = 1.0, bgMusic = 'none', aspectRatio = '9:16') {
        const finalPath = outputPath || path_1.default.join(this.outputDir, `final_${Date.now()}.mp4`);
        await promises_1.default.mkdir(path_1.default.dirname(finalPath), { recursive: true });
        try {
            const info = await this.getLocalVideoInfo(videoPath);
            const crop = this.needsSmartCrop(info.width, info.height, aspectRatio);
            // Escape paths for ffmpeg filters
            const escSubtitlePath = subtitlePath.replace(/\\\\/g, '\\\\\\\\').replace(/:/g, '\\\\:');
            // Check if we need background music
            let finalBgAudioPath = videoPath; // By default, use video's original audio
            if (bgMusic !== 'none') {
                const musicUrls = {
                    'lofi': 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
                    'phonk': 'https://cdn.pixabay.com/audio/2023/04/11/audio_1e8db9291b.mp3',
                    'trap': 'https://cdn.pixabay.com/audio/2022/12/28/audio_af12f8646f.mp3',
                    'creepy': 'https://cdn.pixabay.com/audio/2022/03/15/audio_24a1352e00.mp3'
                };
                const mUrl = musicUrls[bgMusic];
                if (mUrl) {
                    const tempMusicPath = path_1.default.join(this.tempDir, `music_${Date.now()}.mp3`);
                    try {
                        await execAsync(`curl -sL "${mUrl}" -o "${tempMusicPath}"`);
                        finalBgAudioPath = tempMusicPath;
                    }
                    catch (e) {
                        logger_1.default.warn(`Failed to download bg music, falling back to original audio: ${e}`);
                    }
                }
            }
            return new Promise((resolve, reject) => {
                let command = (0, fluent_ffmpeg_1.default)(videoPath)
                    .input(audioPath);
                if (finalBgAudioPath !== videoPath) {
                    command = command.input(finalBgAudioPath);
                }
                // Build complex filter for cropping, volume, and subtitles
                let filterParts = [];
                // 1. Audio mixing
                if (finalBgAudioPath !== videoPath) {
                    filterParts.push(`[2:a]volume=${backgroundVolume}[bg]`);
                }
                else {
                    filterParts.push(`[0:a]volume=${backgroundVolume}[bg]`);
                }
                filterParts.push(`[1:a]volume=${voiceVolume}[vo]`);
                filterParts.push(`[bg][vo]amix=inputs=2:duration=first:dropout_transition=2[aout]`);
                // 2. Video cropping & subtitles
                let vout = '[0:v]';
                if (crop) {
                    let targetW, targetH;
                    if (aspectRatio === '9:16') {
                        targetH = info.height;
                        targetW = Math.round(info.height * (9 / 16));
                        filterParts.push(`[0:v]crop=${targetW}:${targetH}:(in_w-${targetW})/2:0[cropped]`);
                    }
                    else {
                        targetW = info.width;
                        targetH = Math.round(info.width * (9 / 16));
                        filterParts.push(`[0:v]crop=${targetW}:${targetH}:0:(in_h-${targetH})/2[cropped]`);
                    }
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