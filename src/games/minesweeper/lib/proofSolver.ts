'use client';

import type { CellState } from '../types/minesweeper';

export type ProofResult = {
  type: 'safe' | 'mine' | 'guess';
  row: number;
  col: number;
  reason: string;
  involvedCells?: [number, number][]; // Cells that contribute to the proof
};

export type GameAnalysis = {
  wasLogicallySolvable: boolean;
  guessPoints: GuessPoint[];
  mistakeAnalysis: MistakeAnalysis | null;
};

export type GuessPoint = {
  moveNumber: number;
  row: number;
  col: number;
  probability: number; // e.g., 0.5 for 50/50
  alternatives: [number, number][];
};

export type MistakeAnalysis = {
  explodedCell: [number, number];
  lastSafeMove: ProofResult | null;
  wasGuessRequired: boolean;
  explanation: string;
};

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

/**
 * Find a single logically provable safe move or mine.
 * Uses constraint-based reasoning.
 */
export function findProof(board: CellState[][]): ProofResult | null {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return null;

  // Strategy 1: Simple counting - find cells where all adjacent mines are flagged
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
        const [safeRow, safeCol] = hiddenNeighbors[0];
        return {
          type: 'safe',
          row: safeRow,
          col: safeCol,
          reason: `Die ${cell.adjacentMines} neben diesem Feld hat bereits alle Minen markiert – dieses Feld ist sicher.`,
          involvedCells: [[r, c], ...neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged)],
        };
      }

      // All remaining hidden cells must be mines
      if (hiddenNeighbors.length === cell.adjacentMines - flaggedCount && hiddenNeighbors.length > 0) {
        const [mineRow, mineCol] = hiddenNeighbors[0];
        return {
          type: 'mine',
          row: mineRow,
          col: mineCol,
          reason: `Die ${cell.adjacentMines} grenzt an genau ${hiddenNeighbors.length} versteckte Felder – ${hiddenNeighbors.length === 1 ? 'dieses muss' : 'alle müssen'} eine Mine sein.`,
          involvedCells: [[r, c]],
        };
      }
    }
  }

  // Strategy 2: Subset analysis - compare constraints between adjacent numbers
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

      // Check neighboring revealed numbers
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

        // Find cells unique to each constraint
        const cellHiddenSet = new Set(cellHidden.map(([hr, hc]) => `${hr},${hc}`));
        const neighborHiddenSet = new Set(neighborHidden.map(([hr, hc]) => `${hr},${hc}`));

        const onlyInCell = cellHidden.filter(([hr, hc]) => !neighborHiddenSet.has(`${hr},${hc}`));
        const onlyInNeighbor = neighborHidden.filter(([hr, hc]) => !cellHiddenSet.has(`${hr},${hc}`));
        const shared = cellHidden.filter(([hr, hc]) => neighborHiddenSet.has(`${hr},${hc}`));

        // If one constraint's hidden cells are a subset of another
        if (shared.length === cellHidden.length && cellRemaining === neighborRemaining && onlyInNeighbor.length > 0) {
          // All cells only in neighbor must be safe
          const [safeRow, safeCol] = onlyInNeighbor[0];
          return {
            type: 'safe',
            row: safeRow,
            col: safeCol,
            reason: `Durch Vergleich der Zahlen ${cell.adjacentMines} und ${neighbor.adjacentMines}: Dieses Feld ist garantiert sicher.`,
            involvedCells: [[r, c], [nr, nc]],
          };
        }

        // If the difference in mine count equals the difference in unique cells
        if (shared.length > 0 && onlyInCell.length === cellRemaining - neighborRemaining && cellRemaining > neighborRemaining) {
          // All cells only in cell must be mines
          const [mineRow, mineCol] = onlyInCell[0];
          return {
            type: 'mine',
            row: mineRow,
            col: mineCol,
            reason: `Durch Vergleich der Zahlen ${cell.adjacentMines} und ${neighbor.adjacentMines}: Dieses Feld muss eine Mine sein.`,
            involvedCells: [[r, c], [nr, nc]],
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if there's any logically provable move available
 */
export function hasLogicalMove(board: CellState[][]): boolean {
  return findProof(board) !== null;
}

/**
 * Find all safe moves currently available
 */
export function findAllSafeMoves(board: CellState[][]): [number, number][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const safeMoves: [number, number][] = [];
  const checked = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isRevealed || cell.adjacentMines === 0) continue;

      const neighbors = getNeighbors(r, c, rows, cols);
      const flaggedCount = neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;
      const hiddenNeighbors = neighbors.filter(
        ([nr, nc]) => !board[nr][nc].isRevealed && !board[nr][nc].isFlagged
      );

      if (flaggedCount === cell.adjacentMines) {
        for (const [hr, hc] of hiddenNeighbors) {
          const key = `${hr},${hc}`;
          if (!checked.has(key)) {
            checked.add(key);
            safeMoves.push([hr, hc]);
          }
        }
      }
    }
  }

  return safeMoves;
}

/**
 * Find all cells that must be mines
 */
export function findAllMines(board: CellState[][]): [number, number][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const mines: [number, number][] = [];
  const checked = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isRevealed || cell.adjacentMines === 0) continue;

      const neighbors = getNeighbors(r, c, rows, cols);
      const flaggedCount = neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;
      const hiddenNeighbors = neighbors.filter(
        ([nr, nc]) => !board[nr][nc].isRevealed && !board[nr][nc].isFlagged
      );

      if (hiddenNeighbors.length === cell.adjacentMines - flaggedCount && hiddenNeighbors.length > 0) {
        for (const [hr, hc] of hiddenNeighbors) {
          const key = `${hr},${hc}`;
          if (!checked.has(key)) {
            checked.add(key);
            mines.push([hr, hc]);
          }
        }
      }
    }
  }

  return mines;
}

/**
 * Analyze a lost game to provide feedback
 */
export function analyzeMistake(
  board: CellState[][],
  explodedRow: number,
  explodedCol: number
): MistakeAnalysis {
  // Find if there was a safe move available before the explosion
  const lastSafeMove = findProof(board);

  // Determine if a guess was required
  const wasGuessRequired = lastSafeMove === null;

  let explanation: string;

  if (wasGuessRequired) {
    explanation = 'An diesem Punkt gab es keinen logisch beweisbaren Zug. Ein Guess war notwendig.';
  } else if (lastSafeMove) {
    if (lastSafeMove.type === 'safe') {
      explanation = `Es gab einen sicheren Zug: ${lastSafeMove.reason}`;
    } else {
      explanation = `Es gab eine logisch zwingende Flagge: ${lastSafeMove.reason}`;
    }
  } else {
    explanation = 'Analyse nicht verfügbar.';
  }

  return {
    explodedCell: [explodedRow, explodedCol],
    lastSafeMove,
    wasGuessRequired,
    explanation,
  };
}

/**
 * Estimate the probability of each hidden cell being a mine
 * Returns cells with roughly equal probabilities (50/50 situations)
 */
export function findGuessOptions(board: CellState[][]): [number, number][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  // Find all hidden cells adjacent to revealed numbers
  const candidates: [number, number][] = [];
  const checked = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isRevealed || cell.isFlagged) continue;

      const key = `${r},${c}`;
      if (checked.has(key)) continue;
      checked.add(key);

      // Check if adjacent to any revealed number
      const neighbors = getNeighbors(r, c, rows, cols);
      const hasAdjacentNumber = neighbors.some(
        ([nr, nc]) => board[nr][nc].isRevealed && board[nr][nc].adjacentMines > 0
      );

      if (hasAdjacentNumber) {
        candidates.push([r, c]);
      }
    }
  }

  return candidates;
}

/**
 * Full game analysis - determines if the game was solvable without guessing
 */
export function analyzeGame(
  board: CellState[][],
  moveHistory: { row: number; col: number; wasGuess: boolean }[]
): GameAnalysis {
  const guessPoints: GuessPoint[] = [];

  moveHistory.forEach((move, index) => {
    if (move.wasGuess) {
      const alternatives = findGuessOptions(board);
      guessPoints.push({
        moveNumber: index + 1,
        row: move.row,
        col: move.col,
        probability: alternatives.length > 0 ? 1 / alternatives.length : 0.5,
        alternatives,
      });
    }
  });

  return {
    wasLogicallySolvable: guessPoints.length === 0,
    guessPoints,
    mistakeAnalysis: null,
  };
}

