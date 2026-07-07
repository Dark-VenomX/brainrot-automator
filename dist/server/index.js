"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
require("dotenv/config");
const ws_1 = __importDefault(require("ws"));
global.WebSocket = ws_1.default;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const supabase_1 = require("./utils/supabase");
const oauth_1 = require("./services/oauth");
const pipeline_1 = require("./services/pipeline");
const scheduler_1 = require("./services/scheduler");
const ai_1 = require("./services/ai");
const diagnostic_1 = require("./services/diagnostic");
const types_1 = require("./types");
const logger_1 = __importDefault(require("./utils/logger"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
exports.app = app;
// Ignore Render's PORT variable (which Next.js uses) and bind to an internal port
const PORT = process.env.API_PORT || 3001;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow any localhost port during development, or fallback to FRONTEND_URL
        if (!origin || origin.startsWith('http://localhost:')) {
            callback(null, true);
        }
        else {
            callback(null, process.env.FRONTEND_URL || 'http://localhost:3000');
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth middleware
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.substring(7);
    try {
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
// =====================
// OAuth Routes
// =====================
app.get('/api/oauth/test', (req, res) => {
    const authUrl = oauth_1.oauthService.getYouTubeAuthUrl('test_state');
    res.send(`<a href="${authUrl}">Click to test OAuth</a><br><br><pre>${authUrl}</pre>`);
});
app.get('/api/oauth/youtube', requireAuth, (req, res) => {
    const state = req.user.id;
    const authUrl = oauth_1.oauthService.getYouTubeAuthUrl(state);
    res.json({ authUrl });
});
app.get('/api/oauth/youtube/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
        return res.status(400).json({ error: 'Missing code or state' });
    }
    try {
        const tokens = await oauth_1.oauthService.handleYouTubeCallback(code);
        const channelInfo = await oauth_1.oauthService.getYouTubeChannelInfo(tokens.access_token);
        await oauth_1.oauthService.linkAccount(userId, 'youtube', channelInfo.id, channelInfo.title, tokens, { thumbnail: channelInfo.thumbnailUrl });
        res.redirect(`${process.env.FRONTEND_URL || ''}/workspace?linked=youtube`);
    }
    catch (error) {
        logger_1.default.error(`YouTube OAuth callback error: ${error}`);
        const msg = error?.message || String(error);
        res.redirect(`${process.env.FRONTEND_URL || ''}/workspace?error=youtube_link_failed&message=${encodeURIComponent(msg)}`);
    }
});
app.get('/api/oauth/instagram', requireAuth, (req, res) => {
    const state = req.user.id;
    const authUrl = oauth_1.oauthService.getInstagramAuthUrl(state);
    res.json({ authUrl });
});
app.get('/api/oauth/instagram/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
        return res.status(400).json({ error: 'Missing code or state' });
    }
    try {
        const tokens = await oauth_1.oauthService.handleInstagramCallback(code);
        const accountInfo = await oauth_1.oauthService.getInstagramAccountInfo(tokens.access_token);
        await oauth_1.oauthService.linkAccount(userId, 'instagram', accountInfo.id, accountInfo.username, tokens);
        res.redirect(`${process.env.FRONTEND_URL || ''}/workspace?linked=instagram`);
    }
    catch (error) {
        logger_1.default.error(`Instagram OAuth callback error: ${error}`);
        res.redirect(`${process.env.FRONTEND_URL || ''}/workspace?error=instagram_link_failed`);
    }
});
app.get('/api/accounts', requireAuth, async (req, res) => {
    try {
        const accounts = await oauth_1.oauthService.getUserAccounts(req.user.id);
        res.json({ accounts });
    }
    catch (error) {
        logger_1.default.error(`Error fetching accounts: ${error}`);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});
app.delete('/api/accounts/:accountId', requireAuth, async (req, res) => {
    try {
        await oauth_1.oauthService.unlinkAccount(req.user.id, req.params.accountId);
        res.json({ success: true });
    }
    catch (error) {
        logger_1.default.error(`Error unlinking account: ${error}`);
        res.status(500).json({ error: 'Failed to unlink account' });
    }
});
// =====================
// Scheduler Settings Routes
// =====================
app.get('/api/scheduler/settings', requireAuth, async (req, res) => {
    try {
        const settings = await scheduler_1.schedulerService.getSettings(req.user.id);
        res.json({ settings });
    }
    catch (error) {
        logger_1.default.error(`Error fetching scheduler settings: ${error}`);
        res.status(500).json({ error: 'Failed to fetch scheduler settings' });
    }
});
app.put('/api/scheduler/settings', requireAuth, async (req, res) => {
    try {
        const normalized = (0, types_1.normalizeSchedulerSettings)(req.body);
        const saved = await scheduler_1.schedulerService.saveSettings(req.user.id, normalized);
        res.json({ settings: saved });
    }
    catch (error) {
        logger_1.default.error(`Error saving scheduler settings: ${error}`);
        res.status(500).json({ error: 'Failed to save scheduler settings' });
    }
});
app.get('/api/scheduler/self-sufficiency', requireAuth, async (req, res) => {
    try {
        const metric = await scheduler_1.schedulerService.getSelfSufficiencyDays(req.user.id);
        res.json(metric);
    }
    catch (error) {
        logger_1.default.error(`Error computing self-sufficiency: ${error}`);
        res.status(500).json({ error: 'Failed to compute self-sufficiency' });
    }
});
app.get('/api/scheduler/status', requireAuth, async (_req, res) => {
    try {
        const status = await scheduler_1.schedulerService.getScheduleStatus();
        res.json(status);
    }
    catch (error) {
        logger_1.default.error(`Error getting scheduler status: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =====================
// Sandbox Test Mode Routes
// =====================
app.get('/api/dev/sandbox', requireAuth, async (req, res) => {
    try {
        const enabled = await pipeline_1.videoPipeline.isSandboxMode(req.user.id);
        res.json({ sandbox_mode: enabled });
    }
    catch (error) {
        logger_1.default.error(`Error reading sandbox mode: ${error}`);
        res.status(500).json({ error: 'Failed to read sandbox mode' });
    }
});
app.put('/api/dev/sandbox', requireAuth, async (req, res) => {
    try {
        const enabled = Boolean(req.body?.sandbox_mode);
        const { error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.PROFILES)
            .update({ sandbox_mode: enabled })
            .eq('id', req.user.id);
        if (error) {
            logger_1.default.error(`Error saving sandbox mode: ${error.message}`);
            return res.status(500).json({ error: 'Failed to save sandbox mode' });
        }
        logger_1.default.info(`User ${req.user.id} set sandbox_mode=${enabled}`);
        res.json({ sandbox_mode: enabled });
    }
    catch (error) {
        logger_1.default.error(`Error toggling sandbox mode: ${error}`);
        res.status(500).json({ error: 'Failed to toggle sandbox mode' });
    }
});
// =====================
// Diagnostic Routes
// =====================
app.post('/api/dev/test-render', requireAuth, async (req, res) => {
    try {
        const { url, start, end, topic } = req.body || {};
        logger_1.default.info(`[DIAG] test-render triggered by user ${req.user.id}`);
        const result = await diagnostic_1.diagnosticService.runTestRender({ url, start, end, topic });
        res.status(result.ok ? 200 : 500).json(result);
    }
    catch (error) {
        logger_1.default.error(`Diagnostic endpoint error: ${error}`);
        res.status(500).json({ ok: false, error: 'Diagnostic failed' });
    }
});
app.get('/api/dev/test-render/status', requireAuth, async (_req, res) => {
    // Lightweight liveness check so the UI can tell whether a render is
    // already in progress (the diagnostic is stateless for now — this
    // always returns idle, but the hook is here for future expansion).
    res.json({ running: false });
});
// =====================
// Video Queue Routes
// =====================
app.post('/api/videos', requireAuth, async (req, res) => {
    try {
        const { source_url, start_timestamp = '00:00', end_timestamp = '00:45', topic_input, generated_script, voice_name = 'en-US-AriaNeural', target_account_ids = [], auto_schedule = false, aspect_ratio = '9:16', niche, bg_music, font_style = 'classic', } = req.body;
        if (!source_url) {
            return res.status(400).json({ error: 'source_url is required' });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .insert({
            user_id: req.user.id,
            source_url,
            start_timestamp,
            end_timestamp,
            topic_input,
            generated_script,
            voice_name,
            target_account_ids,
            status: 'pending',
            metadata: {
                aspect_ratio,
                niche,
                bg_music,
                font_style,
            },
        })
            .select()
            .single();
        if (error) {
            logger_1.default.error(`Error creating video: ${error.message}`);
            return res.status(500).json({ error: 'Failed to create video' });
        }
        if (auto_schedule && target_account_ids.length > 0) {
            await scheduler_1.schedulerService.scheduleForNextSlot(data.id);
        }
        pipeline_1.videoPipeline.processVideo(data.id).catch(err => {
            logger_1.default.error(`Background processing error for ${data.id}: ${err}`);
        });
        res.status(201).json({ video: data });
    }
    catch (error) {
        logger_1.default.error(`Error in POST /api/videos: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const upload = (0, multer_1.default)({
    dest: path_1.default.join(__dirname, '../../temp_uploads'),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
});
// Upload direct MP4 file
app.post('/api/upload-video', requireAuth, upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }
        // Return a special internal URL that the video service can parse
        const internalUrl = `file://${req.file.path}`;
        res.json({ url: internalUrl });
    }
    catch (error) {
        logger_1.default.error(`Error uploading video: ${error}`);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});
app.get('/api/videos', requireAuth, async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        let query = supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(Number(limit));
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query;
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch videos' });
        }
        res.json({ videos: data });
    }
    catch (error) {
        logger_1.default.error(`Error fetching videos: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/videos/:videoId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('id', req.params.videoId)
            .eq('user_id', req.user.id)
            .single();
        if (error || !data) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json({ video: data });
    }
    catch (error) {
        logger_1.default.error(`Error fetching video: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.patch('/api/videos/:videoId', requireAuth, async (req, res) => {
    try {
        const allowedUpdates = [
            'topic_input',
            'generated_script',
            'voice_name',
            'target_account_ids',
            'start_timestamp',
            'end_timestamp',
        ];
        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid updates provided' });
        }
        const { data, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .update(updates)
            .eq('id', req.params.videoId)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error) {
            return res.status(500).json({ error: 'Failed to update video' });
        }
        res.json({ video: data });
    }
    catch (error) {
        logger_1.default.error(`Error updating video: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete('/api/videos/:videoId', requireAuth, async (req, res) => {
    try {
        // Also purge any local artifacts when manually deleted
        const { data: video } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('id', req.params.videoId)
            .eq('user_id', req.user.id)
            .maybeSingle();
        if (video) {
            await pipeline_1.videoPipeline.purgeLocalArtifacts(video);
        }
        const { error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .delete()
            .eq('id', req.params.videoId)
            .eq('user_id', req.user.id);
        if (error) {
            return res.status(500).json({ error: 'Failed to delete video' });
        }
        res.json({ success: true });
    }
    catch (error) {
        logger_1.default.error(`Error deleting video: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Approve and add to matrix (schedule for posting using dynamic settings)
app.post('/api/videos/:videoId/approve', requireAuth, async (req, res) => {
    try {
        const { data: video, error: fetchError } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('id', req.params.videoId)
            .eq('user_id', req.user.id)
            .single();
        if (fetchError || !video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        if (video.status !== 'ready') {
            return res.status(400).json({ error: 'Video must be ready before approval' });
        }
        if (!video.target_account_ids || video.target_account_ids.length === 0) {
            return res.status(400).json({ error: 'No target accounts selected' });
        }
        const scheduledDate = await scheduler_1.schedulerService.scheduleForNextSlot(video.id);
        if (!scheduledDate) {
            return res.status(400).json({
                error: 'No available scheduling slot. Check your scheduler settings — days and time slots must be configured.',
            });
        }
        res.json({
            success: true,
            scheduled_for: scheduledDate.toISOString(),
        });
    }
    catch (error) {
        logger_1.default.error(`Error approving video: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/videos/:videoId/reprocess', requireAuth, async (req, res) => {
    try {
        const { data: video, error } = await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .select('*')
            .eq('id', req.params.videoId)
            .eq('user_id', req.user.id)
            .single();
        if (error || !video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        await supabase_1.supabaseAdmin
            .from(supabase_1.TABLES.VIDEO_QUEUE)
            .update({ status: 'pending', error_message: null, processing_progress: 0 })
            .eq('id', video.id);
        pipeline_1.videoPipeline.processVideo(video.id).catch(err => {
            logger_1.default.error(`Reprocessing error for ${video.id}: ${err}`);
        });
        res.json({ success: true, message: 'Video queued for reprocessing' });
    }
    catch (error) {
        logger_1.default.error(`Error reprocessing video: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =====================
// AI Routes
// =====================
app.post('/api/ai/script', requireAuth, async (req, res) => {
    try {
        const { topic, video_context } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'topic is required' });
        }
        const result = await ai_1.aiService.generateScript(topic, video_context);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error(`Script generation error: ${error}`);
        res.status(500).json({ error: 'Failed to generate script' });
    }
});
app.get('/api/voices', requireAuth, async (req, res) => {
    try {
        const { language = 'en' } = req.query;
        const voices = await ai_1.ttsService.getAvailableVoices(language);
        res.json({ voices });
    }
    catch (error) {
        logger_1.default.error(`Error fetching voices: ${error}`);
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});
// =====================
// Error handling
// =====================
app.use((err, _req, res, _next) => {
    logger_1.default.error(`Unhandled error: ${err.stack}`);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
const server = (0, http_1.createServer)(app);
exports.server = server;
server.listen(PORT, () => {
    logger_1.default.info(`Express server running on port ${PORT}`);
    scheduler_1.schedulerService.start();
});
//# sourceMappingURL=index.js.map