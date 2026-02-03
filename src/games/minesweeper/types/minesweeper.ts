export type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

export type GameState = 'idle' | 'playing' | 'won' | 'lost';

export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'custom';

export type GameConfig = {
  rows: number;
  cols: number;
  mines: number;
};

export const DIFFICULTY_CONFIGS: Record<Exclude<Difficulty, 'custom'>, GameConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export type BestTimes = Partial<Record<Difficulty, number>>;


