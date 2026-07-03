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
        cardClass: 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40',
        iconBg: 'bg-red-100 dark:bg-red-900',
        iconColor: 'text-red-600 dark:text-red-400',
        icon: <BatteryLow className="w-6 h-6" />,
        title: 'Queue needs attention',
        description: 'Your content buffer is running low. Add more videos to stay self-sufficient.',
        progressColor: 'bg-red-500',
        ringClass: 'ring-2 ring-red-300 dark:ring-red-800 animate-pulse',
      }
    : isWarning
      ? {
          cardClass: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40',
          iconBg: 'bg-amber-100 dark:bg-amber-900',
          iconColor: 'text-amber-600 dark:text-amber-400',
          icon: <BatteryMedium className="w-6 h-6" />,
          title: 'Buffer is moderate',
          description: 'You have a few days of content. Consider adding more to build a safety margin.',
          progressColor: 'bg-amber-500',
          ringClass: '',
        }
      : {
          cardClass: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          icon: <BatteryFull className="w-6 h-6" />,
          title: 'Queue is healthy',
          description: 'You have a solid content buffer. Your automation is self-sufficient.',
          progressColor: 'bg-emerald-500',
          ringClass: '',
        };

  // Progress relative to a 14-day target
  const targetDays = 14;
  const progressPct = Math.min((days / targetDays) * 100, 100);

  return (
    <Card className={`border-2 shadow-lg transition-all ${config.cardClass} ${config.ringClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center ${config.iconColor}`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Self-Sufficiency Tracker
              </CardTitle>
              <CardDescription className={isCritical ? 'text-red-700 dark:text-red-300 font-medium' : ''}>
                {config.title}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${config.iconColor}`}>{days}</span>
          <span className="text-lg text-muted-foreground">day{days === 1 ? '' : 's'} of content queued</span>
        </div>

        <Progress value={progressPct} className={`h-2 ${config.progressColor}`} />

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Queued videos:</span>
            <span className="font-semibold">{scheduledCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Slots / day:</span>
            <span className="font-semibold">{slotsPerDay}</span>
          </div>
        </div>

        {isCritical && (
          <div className="text-sm text-red-700 dark:text-red-300 font-medium pt-1">
            {config.description}
          </div>
        )}
        {!isCritical && (
          <div className="text-sm text-muted-foreground pt-1">
            {config.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
