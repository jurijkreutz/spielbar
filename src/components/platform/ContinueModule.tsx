'use client';

import { useEffect, useState } from 'react';
import { getLastPlayed, type LastPlayedEntry } from '@/lib/analytics';
import { TrackedLink } from '@/components/platform/TrackedLink';

type ContinueAsset = {
  slug: string;
  thumbnail?: string | null;
  continueBackground?: string | null;
};

type ContinueModuleProps = {
  className?: string;
  assets?: ContinueAsset[];
};

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'vor 1 Woche';
  if (weeks < 5) return `vor ${weeks} Wochen`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'vor 1 Monat';
  return `vor ${months} Monaten`;
}

export function ContinueModule({ className = '', assets = [] }: ContinueModuleProps) {
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

  const asset = assets.find((entry) => entry.slug === lastPlayed.slug);
  const backgroundUrl = asset?.continueBackground || asset?.thumbnail || null;
  const relativeTime = formatRelativeTime(lastPlayed.playedAt);
  const isDaily = lastPlayed.mode === 'daily';

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}>
      {backgroundUrl ? (
        <div className="absolute inset-0">
          <img
            src={backgroundUrl}
            alt=""
            className="w-full h-full object-cover scale-110 blur-md opacity-60"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 to-zinc-50" />
      )}
      <div className={`absolute inset-0 ${backgroundUrl ? 'bg-gradient-to-r from-white/90 via-white/70 to-white/40' : 'bg-gradient-to-r from-white/90 via-white/70 to-white/60'}`} />

      <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">Zuletzt gespielt</p>
          <p className="text-lg font-semibold text-zinc-900">{lastPlayed.name}</p>
          {(relativeTime || isDaily) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {isDaily && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-800">
                  Daily
                </span>
              )}
              {relativeTime && (
                <span className="text-xs text-zinc-500">{relativeTime}</span>
              )}
            </div>
          )}
        </div>

        <div className="w-full sm:flex-1 flex items-center justify-center sm:justify-stretch px-1 sm:px-4" aria-hidden="true">
          <div className="relative w-full max-w-[220px] sm:max-w-none h-6">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-zinc-300/70 to-transparent" />
            <div className="continue-flow-spark absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-2 text-zinc-500/70">
              <span className="w-2 h-2 rounded-full bg-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.45)]" />
              <svg className="w-10 h-3" viewBox="0 0 40 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 2 L7 6 L1 10" />
                <path d="M13 2 L19 6 L13 10" />
                <path d="M25 2 L31 6 L25 10" />
              </svg>
            </div>
          </div>
        </div>

        <TrackedLink
          href={lastPlayed.href}
          tracking={{ type: 'continue_click', slug: lastPlayed.slug }}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors shrink-0"
        >
          Weitermachen →
        </TrackedLink>
      </div>
    </div>
  );
}
