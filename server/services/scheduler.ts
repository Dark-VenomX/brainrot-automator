import cron from 'node-cron';
import { supabaseAdmin, TABLES } from '../utils/supabase';
import { videoPipeline } from './pipeline';
import logger from '../utils/logger';
import {
  type SchedulerSettings,
  DEFAULT_SCHEDULER_SETTINGS,
  normalizeSchedulerSettings,
} from '../types';

interface ScheduledVideoCandidate {
  id: string;
  user_id: string;
  status: string;
  scheduled_for: string | null;
}

export class SchedulerService {
  private tickJob: cron.ScheduledTask | null = null;
  private processingCheckJob: cron.ScheduledTask | null = null;
  private tz: string;

  constructor() {
    this.tz = process.env.TZ || 'Asia/Kolkata';
  }

  start(): void {
    // Every minute, check for videos whose scheduled_for time has arrived
    this.tickJob = cron.schedule(
      '* * * * *',
      () => this.tick(),
      { timezone: this.tz },
    );

    // Every 5 minutes, pick up pending (unscheduled) videos for processing
    this.processingCheckJob = cron.schedule(
      '*/5 * * * *',
      () => this.checkAndProcessPendingVideos(),
      { timezone: this.tz },
    );

    logger.info(`Scheduler started (dynamic per-user mode, tz=${this.tz})`);
  }

  stop(): void {
    if (this.tickJob) this.tickJob.stop();
    if (this.processingCheckJob) this.processingCheckJob.stop();
    this.tickJob = null;
    this.processingCheckJob = null;
    logger.info('Scheduler stopped');
  }

  // =====================
  // Settings persistence
  // =====================

  async getSettings(userId: string): Promise<SchedulerSettings> {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .select('scheduler_settings')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error(`Failed to load scheduler settings: ${error.message}`);
      return { ...DEFAULT_SCHEDULER_SETTINGS };
    }

    return normalizeSchedulerSettings(data?.scheduler_settings);
  }

  async saveSettings(userId: string, settings: SchedulerSettings): Promise<SchedulerSettings> {
    const normalized = normalizeSchedulerSettings(settings);

    const { error } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .update({
        scheduler_settings: normalized as unknown as Record<string, unknown>,
        scheduler_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      logger.error(`Failed to save scheduler settings: ${error.message}`);
      throw error;
    }

    logger.info(`Saved scheduler settings for user ${userId}: ${JSON.stringify(normalized)}`);
    return normalized;
  }

  // =====================
  // Scheduling logic
  // =====================

  /**
   * Compute the next available posting slot for a user based on their
   * scheduler settings. Returns null if scheduling is disabled or no
   * valid slot can be found within the next 14 days.
   */
  async computeNextSlot(userId: string, from: Date = new Date()): Promise<Date | null> {
    const settings = await this.getSettings(userId);

    if (!settings.enabled || settings.time_slots.length === 0 || settings.days_of_week.length === 0) {
      return null;
    }

    const sortedSlots = [...settings.time_slots].sort();
    const allowedDays = new Set(settings.days_of_week);

    // Walk forward minute-by-minute would be wasteful; iterate day + slot.
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const candidate = new Date(from);
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setSeconds(0, 0);

      const dow = candidate.getDay();
      if (!allowedDays.has(dow)) continue;

      for (const slot of sortedSlots) {
        const [h, m] = slot.split(':').map(Number);
        candidate.setHours(h, m, 0, 0);

        // If this slot is in the future (or today's later slot), use it
        if (candidate.getTime() > from.getTime()) {
          // Check how many videos are already scheduled for this exact slot
          // to avoid double-booking. If videos_per_day allows multiple at
          // the same time, we still pick the earliest free slot.
          const count = await this.countScheduledAt(userId, candidate);
          if (count === 0) {
            return candidate;
          }
        }
      }
    }

    logger.warn(`No free scheduling slot found for user ${userId} within 14 days`);
    return null;
  }

  private async countScheduledAt(userId: string, when: Date): Promise<number> {
    const start = new Date(when.getTime() - 30 * 1000);
    const end = new Date(when.getTime() + 30 * 1000);

    const { count, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_for', start.toISOString())
      .lte('scheduled_for', end.toISOString());

    if (error) {
      logger.error(`countScheduledAt failed: ${error.message}`);
      return 0;
    }

    return count ?? 0;
  }

  async scheduleVideo(videoId: string, scheduledFor: Date): Promise<void> {
    await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .update({
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled',
      })
      .eq('id', videoId);

    logger.info(`Video ${videoId} scheduled for ${scheduledFor.toISOString()}`);
  }

  async scheduleForNextSlot(videoId: string): Promise<Date | null> {
    const { data: video, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('user_id')
      .eq('id', videoId)
      .maybeSingle();

    if (error || !video) {
      throw new Error(`Video ${videoId} not found`);
    }

    const slot = await this.computeNextSlot(video.user_id);
    if (!slot) {
      logger.warn(`No slot available for video ${videoId}; leaving as ready`);
      return null;
    }

    await this.scheduleVideo(videoId, slot);
    return slot;
  }

  // =====================
  // Tick — post due videos
  // =====================

  private async tick(): Promise<void> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60 * 1000);

      // Find videos scheduled to go out in the last minute (or slightly overdue)
      const { data: due, error } = await supabaseAdmin
        .from(TABLES.VIDEO_QUEUE)
        .select('id, user_id, status, scheduled_for')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now.toISOString())
        .gte('scheduled_for', windowStart.toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(10);

      if (error) {
        logger.error(`Scheduler tick query failed: ${error.message}`);
        return;
      }

      if (!due || due.length === 0) return;

      for (const video of due as ScheduledVideoCandidate[]) {
        // Verify the user's settings still allow posting today
        const settings = await this.getSettings(video.user_id);
        if (!settings.enabled) {
          logger.info(`Skipping video ${video.id}: user disabled scheduler`);
          continue;
        }

        const scheduledDate = new Date(video.scheduled_for!);
        const dow = scheduledDate.getDay();
        if (!settings.days_of_week.includes(dow)) {
          logger.info(`Rescheduling video ${video.id}: day ${dow} no longer enabled`);
          const newSlot = await this.computeNextSlot(video.user_id, new Date());
          if (newSlot) {
            await this.scheduleVideo(video.id, newSlot);
          }
          continue;
        }

        // Fire and forget — don't block the tick
        this.postVideoSafe(video.id).catch(err => {
          logger.error(`Error posting video ${video.id}: ${err}`);
        });
      }
    } catch (error) {
      logger.error(`Scheduler tick error: ${error}`);
    }
  }

  private async postVideoSafe(videoId: string): Promise<void> {
    try {
      await videoPipeline.postVideo(videoId);
    } catch (error) {
      logger.error(`postVideoSafe failed for ${videoId}: ${error}`);
    }
  }

  private async checkAndProcessPendingVideos(): Promise<void> {
    try {
      const { data: pendingVideos, error } = await supabaseAdmin
        .from(TABLES.VIDEO_QUEUE)
        .select('id')
        .eq('status', 'pending')
        .limit(1);

      if (error) {
        logger.error(`Error checking pending videos: ${error.message}`);
        return;
      }

      if (pendingVideos && pendingVideos.length > 0) {
        logger.info(`Found pending video ${pendingVideos[0].id}, starting processing`);
        videoPipeline.processVideo(pendingVideos[0].id).catch(err => {
          logger.error(`Background processing error for ${pendingVideos[0].id}: ${err}`);
        });
      }
    } catch (error) {
      logger.error(`Error in pending video check: ${error}`);
    }
  }

  // =====================
  // Self-sufficiency metric
  // =====================

  /**
   * Returns how many "days of content" the user has queued up.
   * days = ceil(scheduledCount / videos_per_day)
   */
  async getSelfSufficiencyDays(userId: string): Promise<{
    days: number;
    scheduledCount: number;
    slotsPerDay: number;
  }> {
    const settings = await this.getSettings(userId);
    const slotsPerDay = settings.enabled
      ? Math.max(settings.videos_per_day, settings.time_slots.length, 1)
      : 0;

    const { count, error } = await supabaseAdmin
      .from(TABLES.VIDEO_QUEUE)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['scheduled', 'ready']);

    if (error) {
      logger.error(`Self-sufficiency count failed: ${error.message}`);
      return { days: 0, scheduledCount: 0, slotsPerDay };
    }

    const scheduledCount = count ?? 0;
    const days = slotsPerDay > 0 ? Math.ceil(scheduledCount / slotsPerDay) : 0;

    return { days, scheduledCount, slotsPerDay };
  }

  async getScheduleStatus(): Promise<{
    isRunning: boolean;
    timezone: string;
  }> {
    return {
      isRunning: this.tickJob !== null,
      timezone: this.tz,
    };
  }
}

export const schedulerService = new SchedulerService();
