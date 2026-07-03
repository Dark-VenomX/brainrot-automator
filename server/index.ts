import 'dotenv/config';
import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { supabaseAdmin, TABLES } from './utils/supabase';
import { oauthService } from './services/oauth';
import { videoPipeline } from './services/pipeline';
import { schedulerService } from './services/scheduler';
import { aiService, ttsService } from './services/ai';
import { diagnosticService } from './services/diagnostic';
import { normalizeSchedulerSettings, type SchedulerSettings } from './types';
import logger from './utils/logger';

const app = express();
// Ignore Render's PORT variable (which Next.js uses) and bind to an internal port
const PORT = process.env.API_PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost port during development, or fallback to FRONTEND_URL
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, process.env.FRONTEND_URL || 'http://localhost:3000');
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// =====================
// OAuth Routes
// =====================

app.get('/api/oauth/youtube', requireAuth, (req: Request, res: Response) => {
  const state = (req as any).user.id;
  const authUrl = oauthService.getYouTubeAuthUrl(state);
  res.json({ authUrl });
});

app.get('/api/oauth/youtube/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  try {
    const tokens = await oauthService.handleYouTubeCallback(code as string);
    const channelInfo = await oauthService.getYouTubeChannelInfo(tokens.access_token);

    await oauthService.linkAccount(
      userId as string,
      'youtube',
      channelInfo.id,
      channelInfo.title,
      tokens,
      { thumbnail: channelInfo.thumbnailUrl },
    );

    res.redirect(`${process.env.FRONTEND_URL}/settings?linked=youtube`);
  } catch (error) {
    logger.error(`YouTube OAuth callback error: ${error}`);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=youtube_link_failed`);
  }
});

app.get('/api/oauth/instagram', requireAuth, (req: Request, res: Response) => {
  const state = (req as any).user.id;
  const authUrl = oauthService.getInstagramAuthUrl(state);
  res.json({ authUrl });
});

app.get('/api/oauth/instagram/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  try {
    const tokens = await oauthService.handleInstagramCallback(code as string);
    const accountInfo = await oauthService.getInstagramAccountInfo(tokens.access_token);

    await oauthService.linkAccount(
      userId as string,
      'instagram',
      accountInfo.id,
      accountInfo.username,
      tokens,
    );

    res.redirect(`${process.env.FRONTEND_URL}/settings?linked=instagram`);
  } catch (error) {
    logger.error(`Instagram OAuth callback error: ${error}`);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=instagram_link_failed`);
  }
});

app.get('/api/accounts', requireAuth, async (req: Request, res: Response) => {
  try {
    const accounts = await oauthService.getUserAccounts((req as any).user.id);
    res.json({ accounts });
  } catch (error) {
    logger.error(`Error fetching accounts: ${error}`);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.delete('/api/accounts/:accountId', requireAuth, async (req: Request, res: Response) => {
  try {
    await oauthService.unlinkAccount((req as any).user.id, req.params.accountId);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Error unlinking account: ${error}`);
    res.status(500).json({ error: 'Failed to unlink account' });
  }
});

// =====================
// Scheduler Settings Routes
// =====================

app.get('/api/scheduler/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await schedulerService.getSettings((req as any).user.id);
    res.json({ settings });
  } catch (error) {
    logger.error(`Error fetching scheduler settings: ${error}`);
    res.status(500).json({ error: 'Failed to fetch scheduler settings' });
  }
});

app.put('/api/scheduler/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const normalized = normalizeSchedulerSettings(req.body);
    const saved = await schedulerService.saveSettings((req as any).user.id, normalized);
    res.json({ settings: saved });
  } catch (error) {
    logger.error(`Error saving scheduler settings: ${error}`);
    res.status(500).json({ error: 'Failed to save scheduler settings' });
  }
});

app.get('/api/scheduler/self-sufficiency', requireAuth, async (req: Request, res: Response) => {
  try {
    const metric = await schedulerService.getSelfSufficiencyDays((req as any).user.id);
    res.json(metric);
  } catch (error) {
    logger.error(`Error computing self-sufficiency: ${error}`);
    res.status(500).json({ error: 'Failed to compute self-sufficiency' });
  }
});

app.get('/api/scheduler/status', requireAuth, async (_req: Request, res: Response) => {
  try {
    const status = await schedulerService.getScheduleStatus();
    res.json(status);
  } catch (error) {
    logger.error(`Error getting scheduler status: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// Sandbox Test Mode Routes
// =====================

app.get('/api/dev/sandbox', requireAuth, async (req: Request, res: Response) => {
  try {
    const enabled = await videoPipeline.isSandboxMode((req as any).user.id);
    res.json({ sandbox_mode: enabled });
  } catch (error) {
    logger.error(`Error reading sandbox mode: ${error}`);
    res.status(500).json({ error: 'Failed to read sandbox mode' });
  }
});

app.put('/api/dev/sandbox', requireAuth, async (req: Request, res: Response) => {
  try {
    const enabled = Boolean(req.body?.sandbox_mode);
    const { error } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .update({ sandbox_mode: enabled })
      .eq('id', (req as any).user.id);

    if (error) {
      logger.error(`Error saving sandbox mode: ${error.message}`);
      return res.status(500).json({ error: 'Failed to save sandbox mode' });
    }

    logger.info(`User ${(req as any).user.id} set sandbox_mode=${enabled}`);
    res.json({ sandbox_mode: enabled });
  } catch (error) {
    logger.error(`Error toggling sandbox mode: ${error}`);
    res.status(500).json({ error: 'Failed to toggle sandbox mode' });
  }
});

// =====================
// Diagnostic Routes
// =====================

app.post('/api/dev/test-render', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url, start, end, topic } = req.body || {};
    logger.info(`[DIAG] test-render triggered by user ${(req as any).user.id}`);
    const result = await diagnosticService.runTestRender({ url, start, end, topic });
    res.status(result.ok ? 200 : 500).json(result);
  } catch (error) {
    logger.error(`Diagnostic endpoint error: ${error}`);
    res.status(500).json({ ok: false, error: 'Diagnostic failed' });
  }
});

app.get('/api/dev/test-render/status', requireAuth, async (_req: Request, res: Response) => {
  // Lightweight liveness check so the UI can tell whether a render is
  // already in progress (the diagnostic is stateless for now — this
  // always returns idle, but the hook is here for future expansion).
  res.json({ running: false });
});

// =====================
// Video Queue Routes
// =====================

app.post('/api/videos', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      source_url,
      start_timestamp = '00:00',
      end_timestamp = '00:45',
      topic_input,
      generated_script,
      voice_name = 'en-US-AriaNeural',
      target_account_ids = [],
      auto_schedule = false,
    } = req.body;

    if (!source_url) {
      return res.status(400).json({ error: 'source_url is required' });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .insert({
        user_id: (req as any).user.id,
        source_url,
        start_timestamp,
        end_timestamp,
        topic_input,
        generated_script,
        voice_name,
        target_account_ids,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error(`Error creating video: ${error.message}`);
      return res.status(500).json({ error: 'Failed to create video' });
    }

    if (auto_schedule && target_account_ids.length > 0) {
      await schedulerService.scheduleForNextSlot(data.id);
    }

    videoPipeline.processVideo(data.id).catch(err => {
      logger.error(`Background processing error for ${data.id}: ${err}`);
    });

    res.status(201).json({ video: data });
  } catch (error) {
    logger.error(`Error in POST /api/videos: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/videos', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('*')
      .eq('user_id', (req as any).user.id)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch videos' });
    }

    res.json({ videos: data });
  } catch (error) {
    logger.error(`Error fetching videos: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/videos/:videoId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('*')
      .eq('id', req.params.videoId)
      .eq('user_id', (req as any).user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ video: data });
  } catch (error) {
    logger.error(`Error fetching video: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/videos/:videoId', requireAuth, async (req: Request, res: Response) => {
  try {
    const allowedUpdates = [
      'topic_input',
      'generated_script',
      'voice_name',
      'target_account_ids',
      'start_timestamp',
      'end_timestamp',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .update(updates)
      .eq('id', req.params.videoId)
      .eq('user_id', (req as any).user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update video' });
    }

    res.json({ video: data });
  } catch (error) {
    logger.error(`Error updating video: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/videos/:videoId', requireAuth, async (req: Request, res: Response) => {
  try {
    // Also purge any local artifacts when manually deleted
    const { data: video } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('*')
      .eq('id', req.params.videoId)
      .eq('user_id', (req as any).user.id)
      .maybeSingle();

    if (video) {
      await videoPipeline.purgeLocalArtifacts(video as any);
    }

    const { error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .delete()
      .eq('id', req.params.videoId)
      .eq('user_id', (req as any).user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete video' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting video: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve and add to matrix (schedule for posting using dynamic settings)
app.post('/api/videos/:videoId/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: video, error: fetchError } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('*')
      .eq('id', req.params.videoId)
      .eq('user_id', (req as any).user.id)
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

    const scheduledDate = await schedulerService.scheduleForNextSlot(video.id);

    if (!scheduledDate) {
      return res.status(400).json({
        error: 'No available scheduling slot. Check your scheduler settings — days and time slots must be configured.',
      });
    }

    res.json({
      success: true,
      scheduled_for: scheduledDate.toISOString(),
    });
  } catch (error) {
    logger.error(`Error approving video: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/videos/:videoId/reprocess', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: video, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('*')
      .eq('id', req.params.videoId)
      .eq('user_id', (req as any).user.id)
      .single();

    if (error || !video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .update({ status: 'pending', error_message: null, processing_progress: 0 })
      .eq('id', video.id);

    videoPipeline.processVideo(video.id).catch(err => {
      logger.error(`Reprocessing error for ${video.id}: ${err}`);
    });

    res.json({ success: true, message: 'Video queued for reprocessing' });
  } catch (error) {
    logger.error(`Error reprocessing video: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// AI Routes
// =====================

app.post('/api/ai/script', requireAuth, async (req: Request, res: Response) => {
  try {
    const { topic, video_context } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const result = await aiService.generateScript(topic, video_context);
    res.json(result);
  } catch (error) {
    logger.error(`Script generation error: ${error}`);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

app.get('/api/voices', requireAuth, async (req: Request, res: Response) => {
  try {
    const { language = 'en' } = req.query;
    const voices = await ttsService.getAvailableVoices(language as string);
    res.json({ voices });
  } catch (error) {
    logger.error(`Error fetching voices: ${error}`);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// =====================
// Error handling
// =====================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`Express server running on port ${PORT}`);
  schedulerService.start();
});

export { app, server };
