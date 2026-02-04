'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DailyCardProps {
  game: 'minesweeper' | 'sudoku';
}

const PLAYER_ID_KEY = 'spielbar-player-id';

function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

const gameConfig = {
  minesweeper: {
    title: 'Daily Logic Board',
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
    openText: '1 Versuch pro Tag.',
    completedText: 'Morgen kommt das nächste.',
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
    openText: 'Heute neues Rätsel.',
    completedText: 'Morgen kommt das nächste.',
  },
};

export function DailyCard({ game }: DailyCardProps) {
  const [status, setStatus] = useState<'loading' | 'open' | 'completed'>('loading');

  useEffect(() => {
    async function checkStatus() {
      try {
        const playerId = getPlayerId();
        if (!playerId) {
          setStatus('open');
          return;
        }

        const date = getTodayDateString();
        const config = gameConfig[game];
        const res = await fetch(`${config.apiEndpoint}?date=${date}&playerId=${playerId}`);

        if (!res.ok) {
          setStatus('open');
          return;
        }

        const data = await res.json();

        // Check if attempt exists and is completed
        if (data.attempt?.completed) {
          setStatus('completed');
        } else {
          setStatus('open');
        }
      } catch {
        // On error, assume open
        setStatus('open');
      }
    }

    checkStatus();
  }, [game]);

  const config = gameConfig[game];
  const isCompleted = status === 'completed';
  const showStatus = status !== 'loading';

  return (
    <Link
      href={config.href}
      className={`group bg-white rounded-2xl border ${config.borderColor} p-6 ${config.borderHover} hover:shadow-lg transition-all`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} rounded-xl flex items-center justify-center text-3xl flex-shrink-0`}>
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 ${config.badgeBg} ${config.badgeText} text-xs font-medium rounded-full`}>
              Daily
            </span>
            {showStatus && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-600'
              }`}>
                {isCompleted ? 'Erledigt ✅' : 'Heute offen'}
              </span>
            )}
          </div>
          <h3 className={`text-lg font-bold text-zinc-900 ${config.hoverText} transition-colors`}>
            {config.title}
          </h3>
          <p className="text-sm text-zinc-600 mt-1">
            {config.description}
          </p>
          {showStatus && (
            <p className="text-xs text-zinc-400 mt-2">
              {isCompleted ? config.completedText : config.openText}
            </p>
          )}
        </div>
        <span className={`${config.arrowColor} group-hover:translate-x-1 transition-transform mt-2 flex-shrink-0`}>
          →
        </span>
      </div>
    </Link>
  );
}
