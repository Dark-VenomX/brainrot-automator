"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSchedulerSettings = exports.DEFAULT_SCHEDULER_SETTINGS = void 0;
exports.DEFAULT_SCHEDULER_SETTINGS = {
    enabled: true,
    days_of_week: [1, 2, 3, 4, 5],
    videos_per_day: 2,
    time_slots: ['12:30', '19:30'],
};
function normalizeSchedulerSettings(raw) {
    if (!raw || typeof raw !== 'object') {
        return { ...exports.DEFAULT_SCHEDULER_SETTINGS };
    }
    const obj = raw;
    const days = Array.isArray(obj.days_of_week)
        ? obj.days_of_week
            .filter(d => typeof d === 'number' && d >= 0 && d <= 6)
            .map(d => d)
        : exports.DEFAULT_SCHEDULER_SETTINGS.days_of_week;
    const slots = Array.isArray(obj.time_slots)
        ? obj.time_slots
            .filter(s => typeof s === 'string' && /^\d{1,2}:\d{2}$/.test(s))
            .map(s => s)
        : exports.DEFAULT_SCHEDULER_SETTINGS.time_slots;
    const perDay = typeof obj.videos_per_day === 'number' && obj.videos_per_day > 0
        ? Math.min(Math.floor(obj.videos_per_day), 24)
        : exports.DEFAULT_SCHEDULER_SETTINGS.videos_per_day;
    return {
        enabled: typeof obj.enabled === 'boolean' ? obj.enabled : exports.DEFAULT_SCHEDULER_SETTINGS.enabled,
        days_of_week: days.length > 0 ? days : exports.DEFAULT_SCHEDULER_SETTINGS.days_of_week,
        videos_per_day: perDay,
        time_slots: slots.length > 0 ? slots : exports.DEFAULT_SCHEDULER_SETTINGS.time_slots,
    };
}
exports.normalizeSchedulerSettings = normalizeSchedulerSettings;
//# sourceMappingURL=index.js.map