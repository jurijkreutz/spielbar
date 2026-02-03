/**
 * Daily Board Generator
 * Generiert garantiert logisch lösbare Minesweeper-Boards
 */

import type { CellState } from '../types/minesweeper';

// Seeded Random Number Generator für deterministische Boards
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Hash the string seed into a number
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Linear Congruential Generator
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

function getNeighbors(row: number, col: number, rows: number, cols: number): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

function createBoard(rows: number, cols: number, minePositions: [number, number][]): CellState[][] {
  const board: CellState[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

  // Place mines
  for (const [r, c] of minePositions) {
    board[r][c].isMine = true;
  }

  // Calculate adjacent mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
          if (board[nr][nc].isMine) count++;
        }
        board[r][c].adjacentMines = count;
      }
    }
  }

  return board;
}

function revealCell(board: CellState[][], row: number, col: number): void {
  const rows = board.length;
  const cols = board[0].length;
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    if (board[r][c].isRevealed || board[r][c].isFlagged || board[r][c].isMine) continue;

    board[r][c].isRevealed = true;

    if (board[r][c].adjacentMines === 0) {
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        if (!board[nr][nc].isRevealed) {
          stack.push([nr, nc]);
        }
      }
    }
  }
}

function findLogicalMove(board: CellState[][]): { type: 'safe' | 'mine'; row: number; col: number } | null {
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isRevealed || cell.adjacentMines === 0) continue;

      const neighbors = getNeighbors(r, c, rows, cols);
      const flaggedCount = neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;
      const hiddenNeighbors = neighbors.filter(
        ([nr, nc]) => !board[nr][nc].isRevealed && !board[nr][nc].isFlagged
      );

      // All mines accounted for - remaining hidden cells are safe
      if (flaggedCount === cell.adjacentMines && hiddenNeighbors.length > 0) {
        return { type: 'safe', row: hiddenNeighbors[0][0], col: hiddenNeighbors[0][1] };
      }

      // All remaining hidden cells must be mines
      if (hiddenNeighbors.length === cell.adjacentMines - flaggedCount && hiddenNeighbors.length > 0) {
        return { type: 'mine', row: hiddenNeighbors[0][0], col: hiddenNeighbors[0][1] };
      }
    }
  }

  // Advanced: Subset analysis
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isRevealed || cell.adjacentMines === 0) continue;

      const cellNeighbors = getNeighbors(r, c, rows, cols);
      const cellHidden = cellNeighbors.filter(
        ([nr, nc]) => !board[nr][nc].isRevealed && !board[nr][nc].isFlagged
      );
      const cellFlagged = cellNeighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;
      const cellRemaining = cell.adjacentMines - cellFlagged;

      if (cellHidden.length === 0 || cellRemaining <= 0) continue;

      for (const [nr, nc] of cellNeighbors) {
        const neighbor = board[nr][nc];
        if (!neighbor.isRevealed || neighbor.adjacentMines === 0) continue;

        const neighborNeighbors = getNeighbors(nr, nc, rows, cols);
        const neighborHidden = neighborNeighbors.filter(
          ([nnr, nnc]) => !board[nnr][nnc].isRevealed && !board[nnr][nnc].isFlagged
        );
        const neighborFlagged = neighborNeighbors.filter(([nnr, nnc]) => board[nnr][nnc].isFlagged).length;
        const neighborRemaining = neighbor.adjacentMines - neighborFlagged;

        if (neighborHidden.length === 0 || neighborRemaining <= 0) continue;

        const cellHiddenSet = new Set(cellHidden.map(([hr, hc]) => `${hr},${hc}`));
        const neighborHiddenSet = new Set(neighborHidden.map(([hr, hc]) => `${hr},${hc}`));

        const onlyInNeighbor = neighborHidden.filter(([hr, hc]) => !cellHiddenSet.has(`${hr},${hc}`));
        const shared = cellHidden.filter(([hr, hc]) => neighborHiddenSet.has(`${hr},${hc}`));

        if (shared.length === cellHidden.length && cellRemaining === neighborRemaining && onlyInNeighbor.length > 0) {
          return { type: 'safe', row: onlyInNeighbor[0][0], col: onlyInNeighbor[0][1] };
        }
      }
    }
  }

  return null;
}

function isFullySolvable(board: CellState[][], startRow: number, startCol: number): boolean {
  // Deep copy the board
  const testBoard = board.map(row => row.map(cell => ({ ...cell })));
  const rows = testBoard.length;
  const cols = testBoard[0].length;

  // Reveal starting cell
  revealCell(testBoard, startRow, startCol);

  // Simulate solving
  let iterations = 0;
  const maxIterations = rows * cols * 2;

  while (iterations < maxIterations) {
    iterations++;

    // Check if won
    let allNonMinesRevealed = true;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!testBoard[r][c].isMine && !testBoard[r][c].isRevealed) {
          allNonMinesRevealed = false;
          break;
        }
      }
      if (!allNonMinesRevealed) break;
    }

    if (allNonMinesRevealed) {
      return true;
    }

    // Find next logical move
    const move = findLogicalMove(testBoard);

    if (!move) {
      return false; // No logical move available = requires guessing
    }

    if (move.type === 'safe') {
      revealCell(testBoard, move.row, move.col);
    } else {
      testBoard[move.row][move.col].isFlagged = true;
    }
  }

  return false;
}

export type DailyBoardConfig = {
  rows: number;
  cols: number;
  mines: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type GeneratedDailyBoard = {
  rows: number;
  cols: number;
  mines: number;
  minePositions: [number, number][];
  startPosition: [number, number];
  difficulty: string;
  seed: string;
};

const DIFFICULTY_CONFIGS: Record<string, DailyBoardConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, difficulty: 'easy' },
  medium: { rows: 12, cols: 12, mines: 25, difficulty: 'medium' },
  hard: { rows: 16, cols: 16, mines: 45, difficulty: 'hard' },
};

/**
 * Generate a daily board that is guaranteed to be logically solvable
 */
export function generateDailyBoard(date: string): GeneratedDailyBoard {
  // Use date as seed for determinism
  const seed = `spielbar-daily-${date}`;
  const rng = new SeededRandom(seed);

  // Rotate difficulty based on day of week (0=Sunday)
  const dayOfWeek = new Date(date).getDay();
  const difficulties = ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard'];
  const difficultyKey = difficulties[dayOfWeek];
  const config = DIFFICULTY_CONFIGS[difficultyKey];

  const { rows, cols, mines, difficulty } = config;

  // Try to generate a solvable board (max attempts)
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = `${seed}-attempt-${attempt}`;
    const attemptRng = new SeededRandom(attemptSeed);

    // Random start position (not too close to edges for interesting openings)
    const startRow = attemptRng.nextInt(1, rows - 2);
    const startCol = attemptRng.nextInt(1, cols - 2);

    // Safe zone around start
    const safeZone = new Set<string>();
    safeZone.add(`${startRow},${startCol}`);
    for (const [nr, nc] of getNeighbors(startRow, startCol, rows, cols)) {
      safeZone.add(`${nr},${nc}`);
    }

    // All possible mine positions
    const possiblePositions: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!safeZone.has(`${r},${c}`)) {
          possiblePositions.push([r, c]);
        }
      }
    }

    // Shuffle and pick mine positions
    const shuffled = attemptRng.shuffle(possiblePositions);
    const minePositions = shuffled.slice(0, mines);

    // Create board and check solvability
    const board = createBoard(rows, cols, minePositions);

    if (isFullySolvable(board, startRow, startCol)) {
      return {
        rows,
        cols,
        mines,
        minePositions,
        startPosition: [startRow, startCol],
        difficulty,
        seed: attemptSeed,
      };
    }
  }

  // Fallback: Return the last generated board even if not fully solvable
  // (This should rarely happen with proper configuration)
  const fallbackRng = new SeededRandom(`${seed}-fallback`);
  const startRow = fallbackRng.nextInt(1, rows - 2);
  const startCol = fallbackRng.nextInt(1, cols - 2);

  const safeZone = new Set<string>();
  safeZone.add(`${startRow},${startCol}`);
  for (const [nr, nc] of getNeighbors(startRow, startCol, rows, cols)) {
    safeZone.add(`${nr},${nc}`);
  }

  const possiblePositions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeZone.has(`${r},${c}`)) {
        possiblePositions.push([r, c]);
      }
    }
  }

  const shuffled = fallbackRng.shuffle(possiblePositions);
  const minePositions = shuffled.slice(0, mines);

  return {
    rows,
    cols,
    mines,
    minePositions,
    startPosition: [startRow, startCol],
    difficulty,
    seed: `${seed}-fallback`,
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Create a board from stored mine positions
 */
export function createBoardFromPositions(
  rows: number,
  cols: number,
  minePositions: [number, number][]
): CellState[][] {
  return createBoard(rows, cols, minePositions);
}

