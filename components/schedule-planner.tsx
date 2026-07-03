'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient, type SchedulerSettings } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { value: 0, label: 'Sun', full: 'Sunday' },
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
];

const DEFAULT_SETTINGS: SchedulerSettings = {
  enabled: true,
  days_of_week: [1, 2, 3, 4, 5],
  videos_per_day: 2,
  time_slots: ['12:30', '19:30'],
};

interface SchedulePlannerProps {
  onSaved?: () => void;
}

export function SchedulePlanner({ onSaved }: SchedulePlannerProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SchedulerSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState('12:00');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSchedulerSettings();
      setSettings(res.settings);
    } catch (err) {
      console.error('Failed to load scheduler settings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const toggleDay = (day: number) => {
    setSettings(prev => {
      const has = prev.days_of_week.includes(day);
      return {
        ...prev,
        days_of_week: has
          ? prev.days_of_week.filter(d => d !== day)
          : [...prev.days_of_week, day].sort(),
      };
    });
  };

  const addSlot = () => {
    if (!/^\d{1,2}:\d{2}$/.test(newSlot)) {
      toast.error('Use HH:MM format (e.g. 09:00)');
      return;
    }
    if (settings.time_slots.includes(newSlot)) {
      toast.error('That time slot already exists');
      return;
    }
    setSettings(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, newSlot].sort(),
    }));
    setNewSlot('12:00');
  };

  const removeSlot = (slot: string) => {
    setSettings(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter(s => s !== slot),
      videos_per_day: Math.min(prev.videos_per_day, prev.time_slots.length - 1),
    }));
  };

  const handleSave = async () => {
    if (settings.enabled && settings.days_of_week.length === 0) {
      toast.error('Select at least one day of the week');
      return;
    }
    if (settings.enabled && settings.time_slots.length === 0) {
      toast.error('Add at least one time slot');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.saveSchedulerSettings(settings);
      setSettings(res.settings);
      toast.success('Schedule saved');
      onSaved?.();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const slotCount = settings.time_slots.length;
  const effectivePerDay = Math.min(settings.videos_per_day, slotCount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="w-4 h-4 mr-2" />
          Schedule Planner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Schedule Planner
          </DialogTitle>
          <DialogDescription>
            Configure when your videos go live. The scheduler uses these settings to assign posting slots automatically.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Enable / Disable */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div>
                <Label htmlFor="sched-enabled" className="font-semibold">
                  Auto-posting enabled
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  When disabled, no videos will be posted automatically.
                </p>
              </div>
              <Switch
                id="sched-enabled"
                checked={settings.enabled}
                onCheckedChange={v => setSettings(prev => ({ ...prev, enabled: v }))}
              />
            </div>

            {/* Days of week */}
            <div className={`space-y-3 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <Label className="font-semibold">Days of the week</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Toggle which days the scheduler is allowed to post.
                </p>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(day => {
                  const active = settings.days_of_week.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`flex flex-col items-center justify-center py-3 rounded-lg border-2 transition-all ${
                        active
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'border-border hover:border-blue-300 text-muted-foreground'
                      }`}
                      title={day.full}
                    >
                      <span className="text-sm">{day.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {settings.days_of_week.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No days selected</span>
                ) : (
                  settings.days_of_week
                    .sort()
                    .map(d => (
                      <Badge key={d} variant="secondary">
                        {DAYS.find(x => x.value === d)?.full}
                      </Badge>
                    ))
                )}
              </div>
            </div>

            <Separator />

            {/* Time slots */}
            <div className={`space-y-3 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <Label className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time slots
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add the times at which videos should go live each selected day.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newSlot}
                  onChange={e => setNewSlot(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={addSlot} variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                {settings.time_slots.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No time slots configured</span>
                ) : (
                  settings.time_slots
                    .sort()
                    .map(slot => (
                      <div
                        key={slot}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card"
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-mono">{slot}</span>
                        <button
                          type="button"
                          onClick={() => removeSlot(slot)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            <Separator />

            {/* Videos per day */}
            <div className={`space-y-3 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <Label htmlFor="per-day" className="font-semibold">
                  Videos per day
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  How many videos to publish per selected day. Capped by the number of time slots ({slotCount}).
                </p>
              </div>
              <Input
                id="per-day"
                type="number"
                min={1}
                max={Math.max(slotCount, 1)}
                value={settings.videos_per_day}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    videos_per_day: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
              />
              {effectivePerDay < settings.videos_per_day && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Will be capped to {effectivePerDay} (number of time slots).
                </p>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <p className="text-sm">
                <strong>Summary:</strong>{' '}
                {settings.enabled ? (
                  <>
                    Post <strong>{effectivePerDay}</strong> video{effectivePerDay === 1 ? '' : 's'} per day
                    {' '}on <strong>{settings.days_of_week.length}</strong> day{settings.days_of_week.length === 1 ? '' : 's'}
                    {' '}at <strong>{settings.time_slots.join(', ') || '—'}</strong>.
                  </>
                ) : (
                  <>Auto-posting is <strong>disabled</strong>.</>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
