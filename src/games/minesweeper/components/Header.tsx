'use client';

import type { GameState, Difficulty, GameConfig } from '../types/minesweeper';
import { DIFFICULTY_CONFIGS } from '../types/minesweeper';

type HeaderProps = {
  minesRemaining: number;
  time: number;
  gameState: GameState;
  onReset: () => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  customConfig: GameConfig;
  onCustomConfigChange: (config: GameConfig) => void;
};

function formatTime(seconds: number): string {
  return String(Math.min(seconds, 999)).padStart(3, '0');
}

function formatMines(count: number): string {
  return String(Math.max(-99, Math.min(count, 999))).padStart(3, '0');
}

export function Header({
  minesRemaining,
  time,
  gameState,
  onReset,
  difficulty,
  onDifficultyChange,
  customConfig,
  onCustomConfigChange,
}: HeaderProps) {
  const getEmoji = () => {
    switch (gameState) {
      case 'won':
        return '😎';
      case 'lost':
        return '😵';
      default:
        return '🙂';
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex gap-2 justify-center flex-wrap">
        {(['beginner', 'intermediate', 'expert', 'custom'] as Difficulty[]).map(
          (d) => (
            <button
              key={d}
              onClick={() => onDifficultyChange(d)}
              className={`min-h-[40px] px-3 py-2 text-sm font-medium rounded transition-colors cursor-pointer ${
                difficulty === d
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          )
        )}
      </div>

      {difficulty === 'custom' && (
        <div className="flex gap-3 justify-center items-center text-sm flex-wrap">
          <label className="flex items-center gap-1">
            <span className="text-zinc-600">Rows:</span>
            <input
              type="number"
              min={5}
              max={30}
              value={customConfig.rows}
              onChange={(e) =>
                onCustomConfigChange({
                  ...customConfig,
                  rows: Math.max(5, Math.min(30, parseInt(e.target.value) || 5)),
                })
              }
              className="w-14 px-2 py-1 border border-zinc-300 rounded text-center"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-zinc-600">Cols:</span>
            <input
              type="number"
              min={5}
              max={50}
              value={customConfig.cols}
              onChange={(e) =>
                onCustomConfigChange({
                  ...customConfig,
                  cols: Math.max(5, Math.min(50, parseInt(e.target.value) || 5)),
                })
              }
              className="w-14 px-2 py-1 border border-zinc-300 rounded text-center"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-zinc-600">Mines:</span>
            <input
              type="number"
              min={1}
              max={customConfig.rows * customConfig.cols - 9}
              value={customConfig.mines}
              onChange={(e) =>
                onCustomConfigChange({
                  ...customConfig,
                  mines: Math.max(
                    1,
                    Math.min(
                      customConfig.rows * customConfig.cols - 9,
                      parseInt(e.target.value) || 1
                    )
                  ),
                })
              }
              className="w-16 px-2 py-1 border border-zinc-300 rounded text-center"
            />
          </label>
        </div>
      )}

      <div className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded-lg w-full max-w-md">
        <div
          className="font-mono text-2xl text-red-500 bg-black px-2 py-1 rounded tracking-wider"
          aria-label={`${minesRemaining} mines remaining`}
        >
          {formatMines(minesRemaining)}
        </div>

        <button
          onClick={onReset}
          className="h-11 w-11 text-2xl hover:scale-110 transition-transform active:scale-95 cursor-pointer"
          aria-label="New game"
        >
          {getEmoji()}
        </button>

        <div
          className="font-mono text-2xl text-red-500 bg-black px-2 py-1 rounded tracking-wider"
          aria-label={`Time: ${time} seconds`}
        >
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
}
