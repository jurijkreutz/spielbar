'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SudokuBoard, Position, CellValue } from '../types/sudoku';
import { isBoardComplete } from '../types/sudoku';
import { createBoardFromData, getTodayDateString } from '../lib/sudokuGenerator';
import { Board } from './Board';
import { NumberPad } from './NumberPad';
import { DarkModeToggle } from '../hooks/useDarkMode';

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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

type DailySudokuData = {
  date: string;
  puzzle: number[][];
  difficulty: string;
  attempt: {
    completed: boolean;
    won: boolean;
    time: number | null;
    moves: number | null;
  } | null;
};

export function DailyGame() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailySudokuData | null>(null);
  const [board, setBoard] = useState<SudokuBoard | null>(null);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const playerId = typeof window !== 'undefined' ? getPlayerId() : '';

  // Load daily board
  useEffect(() => {
    async function loadDaily() {
      try {
        setLoading(true);
        const date = getTodayDateString();
        const res = await fetch(`/api/daily/sudoku?date=${date}&playerId=${playerId}`);

        if (!res.ok) {
          throw new Error('Fehler beim Laden');
        }

        const data: DailySudokuData = await res.json();
        setDailyData(data);

        // Check if already completed
        if (data.attempt?.completed) {
          setAlreadyCompleted(true);
          setIsComplete(true);
          if (data.attempt.time) setTime(data.attempt.time);
          if (data.attempt.moves) setMoveCount(data.attempt.moves);
        }

        // Create board
        const newBoard = createBoardFromData(data.puzzle);
        setBoard(newBoard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    }

    if (playerId) {
      loadDaily();
    }
  }, [playerId]);

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
      if (!selectedCell || isComplete || !board || alreadyCompleted) return;

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
  }, [selectedCell, isComplete, board, notesMode, alreadyCompleted]);

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

  // Save attempt to server
  const saveAttempt = useCallback(async () => {
    if (!dailyData || alreadyCompleted) return;

    try {
      await fetch('/api/daily/sudoku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dailyData.date,
          playerId,
          completed: true,
          won: true,
          time,
          moves: moveCount,
        }),
      });
    } catch (err) {
      console.error('Error saving attempt:', err);
    }
  }, [dailyData, playerId, time, moveCount, alreadyCompleted]);

  // Zelle auswählen
  const selectCell = useCallback((row: number, col: number) => {
    if (alreadyCompleted) return;
    setSelectedCell({ row, col });
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [isPlaying, alreadyCompleted]);

  // Zahl eingeben
  const enterNumber = useCallback((num: number) => {
    if (!selectedCell || isComplete || !board || alreadyCompleted) return;

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
        // Save wird nach dem State-Update aufgerufen
        setTimeout(() => saveAttempt(), 100);
      }

      return newBoard;
    });
  }, [selectedCell, board, notesMode, isComplete, isPlaying, alreadyCompleted, saveAttempt]);

  // Zelle löschen
  const clearCell = useCallback(() => {
    if (!selectedCell || isComplete || !board || alreadyCompleted) return;

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
  }, [selectedCell, board, isComplete, alreadyCompleted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-zinc-500 dark:text-zinc-400">
          Lädt das heutige Sudoku...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!board || !dailyData) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-6 relative">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-sm font-bold rounded-full">
            📅 TODAY&apos;S SUDOKU
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {new Date(dailyData.date).toLocaleDateString('de-AT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>⏱️</span>
            <span className="font-mono text-lg tabular-nums">
              {formatTime(time)}
            </span>
          </div>

          {/* Züge */}
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span>📝</span>
            <span className="font-mono">{moveCount}</span>
          </div>

          <DarkModeToggle />
        </div>
      </div>

      {/* Status bei bereits gelöst */}
      {alreadyCompleted && (
        <div className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            Bereits gelöst!
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Komm morgen für ein neues Sudoku wieder.
          </p>
        </div>
      )}

      {/* Board */}
      <Board
        board={board}
        selectedCell={selectedCell}
        onCellClick={selectCell}
        gameOver={isComplete || alreadyCompleted}
      />

      {/* Number Pad - nur wenn nicht fertig */}
      {!alreadyCompleted && (
        <NumberPad
          onNumber={enterNumber}
          onClear={clearCell}
          onToggleNotes={() => setNotesMode(m => !m)}
          notesMode={notesMode}
          disabled={isComplete}
          numberCounts={numberCounts}
        />
      )}

      {/* Tastatur-Hinweise */}
      {!alreadyCompleted && (
        <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          <span className="hidden sm:inline">
            Tastatur: ↑↓←→ Navigation • 1-9 Eingabe • ⌫ Löschen • N Notizen
          </span>
        </div>
      )}

      {/* Win Modal */}
      {isComplete && !alreadyCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Geschafft!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-1">
              Du hast das heutige Sudoku gelöst!
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Zeit: {formatTime(time)} • Züge: {moveCount}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Komm morgen für ein neues Sudoku wieder!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

