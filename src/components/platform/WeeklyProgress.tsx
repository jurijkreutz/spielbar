'use client';

import { useEffect, useState } from 'react';
import { DAILY_PROGRESS_EVENT, getWeeklyDailyProgress } from '@/lib/analytics';
import { useStorageAvailability } from '@/lib/safeStorage';

type WeeklyProgressProps = {
  className?: string;
};

export function WeeklyProgress({ className = '' }: WeeklyProgressProps) {
  const availability = useStorageAvailability();
  const [progress, setProgress] = useState<ReturnType<typeof getWeeklyDailyProgress> | null>(null);

  useEffect(() => {
    const update = () => {
      if (!availability.local) return;
      setProgress(getWeeklyDailyProgress());
    };

    update();
    window.addEventListener('storage', update);
    window.addEventListener(DAILY_PROGRESS_EVENT, update as EventListener);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener(DAILY_PROGRESS_EVENT, update as EventListener);
    };
  }, [availability.local]);

  if (!availability.local || progress === null) return null;

  const { count, goal, achieved, weekStreak } = progress;
  const progressPercent = Math.min(100, Math.round((count / goal) * 100));
  const streakLabel = weekStreak === 1 ? '1 Woche' : `${weekStreak} Wochen`;
  const streakInfo =
    'Eine Woche zählt, wenn du an mindestens 3 Tagen ein Daily spielst. Verpasste Tage sind okay.';
  const tooltipId = 'weekly-streak-tooltip';

  return (
    <div className={`rounded-xl premium-surface px-4 py-2 ${className}`}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">Diese Woche</p>
        <div className="flex items-center gap-1.5 justify-self-end">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 whitespace-nowrap">
            Week Streak: {streakLabel}
          </span>
          <div className="relative group">
            <button
              type="button"
              className="relative -top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-[11px] font-semibold text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label="Streak-Erklärung"
              aria-describedby={tooltipId}
            >
              i
            </button>
            <div
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-20 w-64 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-600 shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
            >
              {streakInfo}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800">
          {count} / {goal} Tage gespielt
        </p>
        {achieved && (
          <span className="text-xs font-medium text-emerald-700 whitespace-nowrap">
            Wochenziel erreicht ✓
          </span>
        )}
      </div>

      <div className="mt-1.5 mb-1.5 h-2 rounded-full bg-zinc-200 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
