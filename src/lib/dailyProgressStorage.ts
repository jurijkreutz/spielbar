import { readStorage, removeStorage, writeStorage } from './safeStorage';

export type DailyProgressGame = 'minesweeper' | 'sudoku';

const DAILY_PROGRESS_PREFIX = 'spielbar-daily-progress-v1';

function getDailyProgressKey(game: DailyProgressGame, date: string, playerId: string): string {
  return `${DAILY_PROGRESS_PREFIX}:${game}:${date}:${playerId}`;
}

export function readDailyProgress<T>(
  game: DailyProgressGame,
  date: string,
  playerId: string
): T | null {
  try {
    const stored = readStorage('local', getDailyProgressKey(game, date, playerId), {
      memoryFallback: true,
    });
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function writeDailyProgress(
  game: DailyProgressGame,
  date: string,
  playerId: string,
  payload: unknown
): boolean {
  try {
    return writeStorage(
      'local',
      getDailyProgressKey(game, date, playerId),
      JSON.stringify(payload),
      { memoryFallback: true }
    );
  } catch {
    return false;
  }
}

export function clearDailyProgress(
  game: DailyProgressGame,
  date: string,
  playerId: string
): boolean {
  try {
    return removeStorage('local', getDailyProgressKey(game, date, playerId), {
      memoryFallback: true,
    });
  } catch {
    return false;
  }
}
