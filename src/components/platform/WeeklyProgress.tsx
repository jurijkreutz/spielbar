'use client';

import { useEffect, useState } from 'react';
import { getWeeklyDailyProgress } from '@/lib/analytics';

type WeeklyProgressProps = {
  className?: string;
};

export function WeeklyProgress({ className = '' }: WeeklyProgressProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const progress = getWeeklyDailyProgress();
      setCount(progress.count);
    };

    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  if (count === null) return null;

  let text = 'Noch kein Daily gespielt.';
  if (count >= 1 && count <= 6) {
    text = `Du hast an ${count} Tagen gespielt.`;
  }
  if (count === 7) {
    text = 'Starke Woche: 7/7.';
  }

  return (
    <div className={`rounded-xl premium-surface px-4 py-3 ${className}`}>
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">Diese Woche</p>
      <p className="text-sm text-zinc-700 mt-1">{text}</p>
    </div>
  );
}
