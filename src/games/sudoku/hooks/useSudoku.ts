'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SudokuBoard, Position, CellValue, Difficulty } from '../types/sudoku';
import { isBoardComplete } from '../types/sudoku';
import { generateSudoku } from '../lib/sudokuGenerator';

export function useSudoku(difficulty: Difficulty) {
  const [board, setBoard] = useState<SudokuBoard>(() => generateSudoku(difficulty).puzzle);
  const [solution, setSolution] = useState<number[][]>(() => []);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [time, setTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  // Zählt wie oft jede Zahl auf dem Board vorkommt
  const numberCounts = useMemo(() => {
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

  // Neues Spiel starten
  const newGame = useCallback((newDifficulty?: Difficulty) => {
    const result = generateSudoku(newDifficulty || difficulty);
    setBoard(result.puzzle);
    setSolution(result.solution);
    setSelectedCell(null);
    setNotesMode(false);
    setTime(0);
    setIsComplete(false);
    setMoveCount(0);
  }, [difficulty]);

  // Zelle auswählen
  const selectCell = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  // Zahl eingeben
  const enterNumber = useCallback((num: number) => {
    if (!selectedCell || isComplete) return;

    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isGiven) return;

    setMoveCount(c => c + 1);

    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));

      if (notesMode) {
        // Notizen-Modus: Zahl als Notiz togglen
        if (newBoard[row][col].notes.has(num)) {
          newBoard[row][col].notes.delete(num);
        } else {
          newBoard[row][col].notes.add(num);
        }
        newBoard[row][col].value = 0;
      } else {
        // Normaler Modus: Zahl eingeben
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
      }

      return newBoard;
    });
  }, [selectedCell, board, notesMode, isComplete]);

  // Zelle löschen
  const clearCell = useCallback(() => {
    if (!selectedCell || isComplete) return;

    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isGiven) return;

    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
      newBoard[row][col].value = 0;
      newBoard[row][col].notes = new Set();
      return newBoard;
    });
  }, [selectedCell, board, isComplete]);

  // Notizen-Modus togglen
  const toggleNotesMode = useCallback(() => {
    setNotesMode(prev => !prev);
  }, []);

  // Keyboard Handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || isComplete) return;

    const { row, col } = selectedCell;

    // Zahlen 1-9
    if (e.key >= '1' && e.key <= '9') {
      enterNumber(parseInt(e.key));
      return;
    }

    // Löschen
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      clearCell();
      return;
    }

    // Navigation
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(8, col + 1);
        break;
      case 'n':
      case 'N':
        toggleNotesMode();
        return;
      default:
        return;
    }

    if (newRow !== row || newCol !== col) {
      e.preventDefault();
      setSelectedCell({ row: newRow, col: newCol });
    }
  }, [selectedCell, isComplete, enterNumber, clearCell, toggleNotesMode]);

  return {
    board,
    selectedCell,
    selectCell,
    enterNumber,
    clearCell,
    notesMode,
    toggleNotesMode,
    time,
    setTime,
    isComplete,
    moveCount,
    numberCounts,
    newGame,
    handleKeyDown,
  };
}

