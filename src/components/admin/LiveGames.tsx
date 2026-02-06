'use client';

import { useEffect, useState } from 'react';

interface LiveGame {
  page: string;
  players: number;
}

const GAME_NAMES: Record<string, { name: string; emoji: string }> = {
  '/games/minesweeper': { name: 'Minesweeper', emoji: '💣' },
  '/games/minesweeper/daily': { name: 'Minesweeper Daily', emoji: '📅' },
  '/games/sudoku': { name: 'Sudoku', emoji: '🔢' },
  '/games/sudoku/daily': { name: 'Sudoku Daily', emoji: '📅' },
  '/games/stack-tower': { name: 'Stack Tower', emoji: '🏗️' },
  '/games/snake': { name: 'Snake', emoji: '🐍' },
  '/games/lemonadestand': { name: 'Lemonade Stand', emoji: '🍋' },
  '/games/brick-breaker': { name: 'Brick Breaker', emoji: '🧱' },
};

function resolveGame(page: string) {
  return GAME_NAMES[page] ?? { name: page.replace('/games/', ''), emoji: '🎮' };
}

export default function LiveGames({ initial }: { initial: LiveGame[] }) {
  const [games, setGames] = useState(initial);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const data = await res.json();
          setGames(data.liveGames ?? []);
        }
      } catch {
        // Silently ignore
      }
    };

    const interval = setInterval(fetchGames, 10_000);
    return () => clearInterval(interval);
  }, []);

  const totalPlaying = games.reduce((s, g) => s + g.players, 0);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="text-lg font-semibold text-zinc-900">Spiele jetzt live</h3>
        </div>
        {totalPlaying > 0 && (
          <span className="text-sm text-zinc-500">
            {totalPlaying} {totalPlaying === 1 ? 'Spieler' : 'Spieler'} aktiv
          </span>
        )}
      </div>

      {games.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-zinc-400 text-sm">Gerade spielt niemand.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {games.map((game) => {
            const info = resolveGame(game.page);

            return (
              <div
                key={game.page}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5"
              >
                <span className="text-base">{info.emoji}</span>
                <span className="text-sm font-medium text-zinc-900">{info.name}</span>
                <div className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-semibold tabular-nums px-1.5">
                  {game.players}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-zinc-400 mt-4">Aktualisiert alle 10s</p>
    </div>
  );
}
