'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  DAILY_PROGRESS_EVENT,
  analytics,
  getDailyHubStatus,
  type DailyHubStatus,
} from '@/lib/analytics';
import { useStorageAvailability } from '@/lib/safeStorage';

interface DailyCardProps {
  game: 'minesweeper' | 'sudoku';
}

type StatusUi = {
  label: string;
  badgeClass: string;
};

function getStatusUi(status: DailyHubStatus): StatusUi {
  if (status.state === 'open') {
    return {
      label: '🟢 offen',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    };
  }

  if (status.state === 'started') {
    return {
      label: '🟡 gestartet - Jetzt fortsetzen!',
      badgeClass: 'bg-amber-100 text-amber-800',
    };
  }

  return {
    label: '🟠 für heute fertig',
    badgeClass: 'bg-orange-100 text-orange-800',
  };
}

const gameConfig = {
  minesweeper: {
    title: 'Daily Minesweeper',
    emoji: '💣',
    href: '/games/minesweeper/daily',
    apiEndpoint: '/api/daily',
    gradientFrom: 'from-amber-100',
    gradientTo: 'to-orange-100',
    borderColor: 'border-amber-200',
    borderHover: 'hover:border-amber-400',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    arrowColor: 'text-amber-500',
    hoverText: 'group-hover:text-amber-700',
    description: 'Garantiert lösbar ohne Raten',
  },
  sudoku: {
    title: 'Daily Sudoku',
    emoji: '🔢',
    href: '/games/sudoku/daily',
    apiEndpoint: '/api/daily/sudoku',
    gradientFrom: 'from-blue-100',
    gradientTo: 'to-indigo-100',
    borderColor: 'border-blue-200',
    borderHover: 'hover:border-blue-400',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    arrowColor: 'text-blue-500',
    hoverText: 'group-hover:text-blue-700',
    description: 'Das tägliche Zahlenrätsel',
  },
};

export function DailyCard({ game }: DailyCardProps) {
  const availability = useStorageAvailability();
  const [status, setStatus] = useState<DailyHubStatus>({ game, state: 'open' });
  const linkRef = useRef<HTMLDivElement | null>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (!availability.local) {
      return;
    }

    const updateStatus = () => {
      setStatus(getDailyHubStatus(game));
    };

    updateStatus();
    window.addEventListener('storage', updateStatus);
    window.addEventListener(DAILY_PROGRESS_EVENT, updateStatus as EventListener);
    return () => {
      window.removeEventListener('storage', updateStatus);
      window.removeEventListener(DAILY_PROGRESS_EVENT, updateStatus as EventListener);
    };
  }, [availability.local, game]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (impressionTracked.current) return;
    const element = linkRef.current;
    if (!element || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            analytics.trackDailyCardImpression(game);
            impressionTracked.current = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [game]);

  const config = gameConfig[game];
  const showStatus = availability.local;
  const statusUi = getStatusUi(status);
  const isOpen = status.state === 'open';
  const isStarted = status.state === 'started';
  const ctaText = isOpen ? 'Daily spielen' : isStarted ? 'Jetzt fortsetzen' : 'Ansehen';

  return (
    <div ref={linkRef} className="h-full">
      <Link
        href={config.href}
        onClick={() => analytics.trackDailyCardClick(game)}
        className={`group block h-full premium-lift bg-white rounded-2xl border ${config.borderColor} p-6 ${config.borderHover} transition-all`}
      >
        <div className="flex items-start gap-4 h-full">
          <div className={`w-16 h-16 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} rounded-xl flex items-center justify-center text-3xl flex-shrink-0`}>
            {config.emoji}
          </div>
          <div className="flex-1 min-w-0 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 ${config.badgeBg} ${config.badgeText} text-xs font-medium rounded-full`}>
                Heute
              </span>
              {showStatus && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusUi.badgeClass}`}>
                  {statusUi.label}
                </span>
              )}
            </div>
            <h3 className={`text-lg font-bold text-zinc-900 ${config.hoverText} transition-colors`}>
              {config.title}
            </h3>
            <p className="text-sm text-zinc-600 mt-1">
              {config.description}
            </p>
            <div className={`mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold ${config.hoverText} transition-colors`}>
              {ctaText}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
