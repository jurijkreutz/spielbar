'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Difficulty, SudokuBoard, Position, CellValue } from '../types/sudoku';
import { DIFFICULTY_CONFIG, isBoardComplete } from '../types/sudoku';
import { generateSudoku } from '../lib/sudokuGenerator';
import { Board } from './Board';
import { NumberPad } from './NumberPad';
import { Header } from './Header';

const BEST_TIMES_KEY = 'sudoku-best-times';

type BestTimes = Partial<Record<Difficulty, number>>;

function loadBestTimes(): BestTimes {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(BEST_TIMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveBestTimes(times: BestTimes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(times));
  } catch {
    // Ignore storage errors
  }
}

export function Game() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<SudokuBoard | null>(null);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [bestTimes, setBestTimes] = useState<BestTimes>(() => loadBestTimes());
  const [initialized, setInitialized] = useState(false);

  // Zähle Zahlen auf dem Board
  const numberCounts = useMemo(() => {
    if (!board) return {};
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;

    for (const row of board) {
      for (const cell of row) {
        if (cell.value !== 0) {
          counts[cell.value]++;
        }
      }
    }
    return counts;
  }, [board]);

  // Neues Spiel
  const newGame = useCallback((newDifficulty?: Difficulty) => {
    const diff = newDifficulty || difficulty;
    const result = generateSudoku(diff);
    setBoard(result.puzzle);
    setSelectedCell(null);
    setNotesMode(false);
    setTime(0);
    setIsPlaying(false);
    setIsComplete(false);
    setMoveCount(0);
    if (newDifficulty) {
      setDifficulty(newDifficulty);
    }
  }, [difficulty]);

  // Zelle auswählen
  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Zahl eingeben
  const enterNumber = useCallback((num: number) => {
    if (!selectedCell || isComplete || !board) return;

    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isGiven) return;

    if (!isPlaying) {
      setIsPlaying(true);
    }

    setMoveCount(c => c + 1);

    setBoard(prev => {
      if (!prev) return prev;
      const newBoard = prev.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));

      if (notesMode) {
        // Notizen-Modus
        if (newBoard[row][col].notes.has(num)) {
          newBoard[row][col].notes.delete(num);
        } else {
          newBoard[row][col].notes.add(num);
        }
        newBoard[row][col].value = 0;
      } else {
        // Normaler Modus
        newBoard[row][col].value = num as CellValue;
        newBoard[row][col].notes = new Set();

        // Entferne die Zahl aus Notizen in gleicher Zeile/Spalte/Box
        for (let r = 0; r < 9; r++) {
          newBoard[r][col].notes.delete(num);
        }
        for (let c = 0; c < 9; c++) {
          newBoard[row][c].notes.delete(num);
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            newBoard[r][c].notes.delete(num);
          }
        }
      }

      // Prüfe ob das Board vollständig ist
      if (isBoardComplete(newBoard)) {
        setIsComplete(true);
        setIsPlaying(false);

        // Best Time speichern
        const currentBest = bestTimes[difficulty];
        if (currentBest === undefined || time < currentBest) {
          const newBestTimes = { ...bestTimes, [difficulty]: time };
          setBestTimes(newBestTimes);
          saveBestTimes(newBestTimes);
        }
      }

      return newBoard;
    });
  }, [selectedCell, board, notesMode, isComplete, isPlaying, bestTimes, difficulty, time]);

  // Zelle löschen
  const clearCell = useCallback(() => {
    if (!selectedCell || isComplete || !board) return;

    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isGiven) return;

    setBoard(prev => {
      if (!prev) return prev;
      const newBoard = prev.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      newBoard[row][col].value = 0;
      newBoard[row][col].notes = new Set();
      return newBoard;
    });
  }, [selectedCell, board, isComplete]);

  // Initialisiere Spiel
  useEffect(() => {
    if (!initialized) {
      newGame();
      setInitialized(true);
    }
  }, [initialized, newGame]);

  // Timer
  useEffect(() => {
    if (!isPlaying || isComplete) return;

    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isComplete]);

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isComplete || !board) return;

      const { row, col } = selectedCell;

      // Zahlen 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        enterNumber(parseInt(e.key));
        return;
      }

      // Löschen
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        clearCell();
        return;
      }

      // Navigation
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          e.preventDefault();
          break;
        case 'ArrowDown':
          newRow = Math.min(8, row + 1);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          newCol = Math.min(8, col + 1);
          e.preventDefault();
          break;
        case 'n':
        case 'N':
          setNotesMode(m => !m);
          return;
        default:
          return;
      }

      if (newRow !== row || newCol !== col) {
        setSelectedCell({ row: newRow, col: newCol });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isComplete, board, notesMode, enterNumber, clearCell]);

  if (!board) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-zinc-500">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 relative">
      <Header
        difficulty={difficulty}
        onDifficultyChange={newGame}
        time={time}
        moveCount={moveCount}
        isComplete={isComplete}
        onNewGame={() => newGame()}
      />

      <Board
        board={board}
        selectedCell={selectedCell}
        onCellClick={selectCell}
        gameOver={isComplete}
      />

      <NumberPad
        onNumber={enterNumber}
        onClear={clearCell}
        onToggleNotes={() => setNotesMode(m => !m)}
        notesMode={notesMode}
        disabled={isComplete}
        numberCounts={numberCounts}
      />

      {/* Tastatur-Hinweise */}
      <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
        <span className="hidden sm:inline">
          Tastatur: ↑↓←→ Navigation • 1-9 Eingabe • ⌫ Löschen • N Notizen
        </span>
      </div>

      {/* Best Time */}
      {bestTimes[difficulty] && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Beste Zeit ({DIFFICULTY_CONFIG[difficulty].name}): {formatTime(bestTimes[difficulty]!)}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
