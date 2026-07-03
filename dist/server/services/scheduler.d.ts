import { type SchedulerSettings } from '../types';
export declare class SchedulerService {
    private tickJob;
    private processingCheckJob;
    private tz;
    constructor();
    start(): void;
    stop(): void;
    getSettings(userId: string): Promise<SchedulerSettings>;
    saveSettings(userId: string, settings: SchedulerSettings): Promise<SchedulerSettings>;
    /**
     * Compute the next available posting slot for a user based on their
     * scheduler settings. Returns null if scheduling is disabled or no
     * valid slot can be found within the next 14 days.
     */
    computeNextSlot(userId: string, from?: Date): Promise<Date | null>;
    private countScheduledAt;
    scheduleVideo(videoId: string, scheduledFor: Date): Promise<void>;
    scheduleForNextSlot(videoId: string): Promise<Date | null>;
    private tick;
    private postVideoSafe;
    private checkAndProcessPendingVideos;
    /**
     * Returns how many "days of content" the user has queued up.
     * days = ceil(scheduledCount / videos_per_day)
     */
    getSelfSufficiencyDays(userId: string): Promise<{
        days: number;
        scheduledCount: number;
        slotsPerDay: number;
    }>;
    getScheduleStatus(): Promise<{
        isRunning: boolean;
        timezone: string;
    }>;
}
export declare const schedulerService: SchedulerService;
//# sourceMappingURL=scheduler.d.ts.map