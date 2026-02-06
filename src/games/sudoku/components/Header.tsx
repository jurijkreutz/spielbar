'use client';

import type { Difficulty } from '../types/sudoku';
import { DIFFICULTY_CONFIG } from '../types/sudoku';
import { DarkModeToggle } from '../hooks/useDarkMode';

type HeaderProps = {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  time: number;
  moveCount: number;
  isComplete: boolean;
  onNewGame: () => void;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function Header({
  difficulty,
  onDifficultyChange,
  time,
  moveCount,
  isComplete,
  onNewGame,
}: HeaderProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 mb-6 w-full">
      {/* Schwierigkeit */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(diff => (
          <button
            key={diff}
            onClick={() => onDifficultyChange(diff)}
            className={`
              min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-100
              ${difficulty === diff
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }
            `}
          >
            {DIFFICULTY_CONFIG[diff].name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 sm:gap-4 text-zinc-600 dark:text-zinc-400 flex-wrap justify-center">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <span className="text-lg">⏱️</span>
          <span className="font-mono text-lg tabular-nums">
            {formatTime(time)}
          </span>
        </div>

        {/* Züge */}
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="font-mono">
            {moveCount}
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <DarkModeToggle />

        {/* Neues Spiel */}
        <button
          onClick={onNewGame}
          className="min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          🔄 Neu
        </button>
      </div>

      {/* Gewonnen-Anzeige */}
      {isComplete && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-2xl p-8 shadow-2xl text-center z-50">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Gelöst!
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Zeit: {formatTime(time)} • Züge: {moveCount}
          </p>
          <button
            onClick={onNewGame}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Neues Spiel
          </button>
        </div>
      )}
    </div>
  );
}
