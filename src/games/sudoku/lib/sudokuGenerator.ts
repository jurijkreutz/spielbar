/**
 * Sudoku Generator
 * Generiert gültige Sudoku-Puzzles mit verschiedenen Schwierigkeitsgraden
 */

import type { SudokuBoard, CellState, CellValue, Difficulty } from '../types/sudoku';
import { DIFFICULTY_CONFIG } from '../types/sudoku';

// Seeded Random Number Generator für deterministische Puzzles
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) || 1;
  }

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

// Erstellt ein leeres Board
function createEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

// Prüft ob eine Zahl in einer Position gültig ist
function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // Zeile prüfen
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }

  // Spalte prüfen
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // 3x3 Box prüfen
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

// Löst ein Sudoku mit Backtracking (für Generator)
function solve(board: number[][], rng?: SeededRandom): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = rng ? rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board, rng)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Zählt die Anzahl der Lösungen (max 2 für Performance)
function countSolutions(board: number[][], count: number = 0): number {
  if (count >= 2) return count;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            count = countSolutions(board, count);
            if (count >= 2) {
              board[row][col] = 0;
              return count;
            }
            board[row][col] = 0;
          }
        }
        return count;
      }
    }
  }
  return count + 1;
}

// Generiert ein vollständig gelöstes Board
function generateSolvedBoard(rng: SeededRandom): number[][] {
  const board = createEmptyBoard();
  solve(board, rng);
  return board;
}

// Entfernt Zellen um ein Puzzle zu erstellen
function createPuzzle(solvedBoard: number[][], clues: number, rng: SeededRandom): number[][] {
  const puzzle = solvedBoard.map(row => [...row]);
  const positions: [number, number][] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }

  const shuffledPositions = rng.shuffle(positions);
  let removedCount = 0;
  const targetRemove = 81 - clues;

  for (const [row, col] of shuffledPositions) {
    if (removedCount >= targetRemove) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    // Prüfe ob das Puzzle noch eindeutig lösbar ist
    const testBoard = puzzle.map(r => [...r]);
    if (countSolutions(testBoard) === 1) {
      removedCount++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return puzzle;
}

// Konvertiert ein number[][] zu einem SudokuBoard
function toSudokuBoard(puzzle: number[][], solution: number[][]): SudokuBoard {
  return puzzle.map((row, r) =>
    row.map((value, c): CellState => ({
      value: value as CellValue,
      isGiven: value !== 0,
      isError: false,
      notes: new Set<number>(),
    }))
  );
}

// Generiert ein neues Sudoku-Puzzle
export function generateSudoku(difficulty: Difficulty, seed?: string): {
  puzzle: SudokuBoard;
  solution: number[][];
  seed: string;
} {
  const actualSeed = seed || `sudoku-${Date.now()}-${Math.random()}`;
  const rng = new SeededRandom(actualSeed);
  const config = DIFFICULTY_CONFIG[difficulty];

  const solution = generateSolvedBoard(rng);
  const puzzleNumbers = createPuzzle(solution, config.clues, rng);
  const puzzle = toSudokuBoard(puzzleNumbers, solution);

  return { puzzle, solution, seed: actualSeed };
}

// Daily Board Generator
export function generateDailySudoku(date: string): {
  puzzle: number[][];
  solution: number[][];
  seed: string;
  difficulty: Difficulty;
} {
  // Seed basiert auf Datum für konsistente Daily Puzzles
  const seed = `daily-sudoku-${date}`;
  const rng = new SeededRandom(seed);

  // Daily ist immer Medium
  const difficulty: Difficulty = 'medium';
  const config = DIFFICULTY_CONFIG[difficulty];

  const solution = generateSolvedBoard(rng);
  const puzzle = createPuzzle(solution, config.clues, rng);

  return { puzzle, solution, seed, difficulty };
}

// Erstellt ein SudokuBoard aus gespeicherten Positionen
export function createBoardFromData(puzzleData: number[][]): SudokuBoard {
  return puzzleData.map(row =>
    row.map((value): CellState => ({
      value: value as CellValue,
      isGiven: value !== 0,
      isError: false,
      notes: new Set<number>(),
    }))
  );
}

// Hilfsfunktion für Datumsformat
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

