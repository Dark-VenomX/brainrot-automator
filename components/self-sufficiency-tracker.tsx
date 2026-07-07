'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient, type SelfSufficiencyMetric } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { BatteryLow, BatteryMedium, BatteryFull, CalendarDays, Clock } from 'lucide-react';

interface SelfSufficiencyTrackerProps {
  refreshKey?: number;
}

export function SelfSufficiencyTracker({ refreshKey }: SelfSufficiencyTrackerProps) {
  const [metric, setMetric] = useState<SelfSufficiencyMetric | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.getSelfSufficiency();
      setMetric(data);
    } catch (err) {
      console.error('Failed to load self-sufficiency metric', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-6 flex items-center justify-center">
          <div className="w-5 h-5 flex items-center justify-center text-muted-foreground"><div className="loader scale-[0.25]"></div></div>
        </CardContent>
      </Card>
    );
  }

  if (!metric) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Unable to load self-sufficiency metric.
        </CardContent>
      </Card>
    );
  }

  const { days, scheduledCount, slotsPerDay } = metric;
  const isCritical = days < 3;
  const isWarning = days >= 3 && days < 7;
  const isHealthy = days >= 7;

  // Visual config based on state
  const config = isCritical
    ? {
        cardClass: 'border-red-500/20 bg-gradient-to-br from-white to-red-50/50 dark:from-black dark:to-red-950/20 backdrop-blur-xl',
        iconBg: 'bg-red-500/10 dark:bg-red-500/20',
        iconColor: 'text-red-500 dark:text-red-400',
        icon: <BatteryLow className="w-6 h-6" />,
        title: 'Queue Needs Attention',
        description: 'Your content buffer is critically low. Add more videos immediately to stay self-sufficient.',
        progressColor: 'bg-gradient-to-r from-red-500 to-orange-500',
        ringClass: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]',
        valueColor: 'text-red-600 dark:text-red-400',
      }
    : isWarning
      ? {
          cardClass: 'border-amber-500/20 bg-gradient-to-br from-white to-amber-50/50 dark:from-black dark:to-amber-950/20 backdrop-blur-xl',
          iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
          iconColor: 'text-amber-500 dark:text-amber-400',
          icon: <BatteryMedium className="w-6 h-6" />,
          title: 'Buffer is Moderate',
          description: 'You have a few days of content. Consider adding more to build a safety margin.',
          progressColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          ringClass: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]',
          valueColor: 'text-amber-600 dark:text-amber-400',
        }
      : {
          cardClass: 'border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl',
          iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          icon: <BatteryFull className="w-6 h-6" />,
          title: 'Queue is Healthy',
          description: 'You have a solid content buffer. Your automation is completely self-sufficient.',
          progressColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          ringClass: 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]',
          valueColor: 'text-emerald-600 dark:text-emerald-400',
        };

  // Progress relative to a 14-day target
  const targetDays = 14;
  const progressPct = Math.min((days / targetDays) * 100, 100);

  return (
    <Card className={`border shadow-lg transition-all duration-500 ${config.cardClass} ${config.ringClass}`}>
      <CardHeader className="pb-3 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center ${config.iconColor} shadow-inner`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Self-Sufficiency Tracker
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 dark:text-slate-400 mt-1">
                {config.title}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-end gap-2 mb-4">
          <span className={`text-5xl font-black tracking-tighter ${config.valueColor}`}>
            {days}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-medium pb-1">
            days of content queued
          </span>
        </div>
        
        <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-6 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${config.progressColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Queued videos: <span className="text-slate-900 dark:text-white font-bold">{scheduledCount}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Slots / day: <span className="text-slate-900 dark:text-white font-bold">{slotsPerDay}</span></span>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}
