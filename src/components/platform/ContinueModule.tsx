'use client';

import { useEffect, useState } from 'react';
import { getLastPlayed, type LastPlayedEntry } from '@/lib/analytics';
import { TrackedLink } from '@/components/platform/TrackedLink';

type ContinueModuleProps = {
  className?: string;
};

export function ContinueModule({ className = '' }: ContinueModuleProps) {
  const [lastPlayed, setLastPlayed] = useState<LastPlayedEntry | null>(null);

  useEffect(() => {
    const update = () => {
      setLastPlayed(getLastPlayed());
    };

    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  if (!lastPlayed || !lastPlayed.href || !lastPlayed.slug || !lastPlayed.name) return null;

  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">Zuletzt gespielt</p>
        <p className="text-lg font-semibold text-zinc-900">{lastPlayed.name}</p>
      </div>
      <TrackedLink
        href={lastPlayed.href}
        tracking={{ type: 'continue_click', slug: lastPlayed.slug }}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
      >
        Weitermachen →
      </TrackedLink>
    </div>
  );
}
