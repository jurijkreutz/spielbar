'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CellState, GameState, GameConfig } from '../types/minesweeper';

function createEmptyBoard(rows: number, cols: number): CellState[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
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

function placeMines(
  board: CellState[][],
  rows: number,
  cols: number,
  mineCount: number,
  safeRow: number,
  safeCol: number
): CellState[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  const safePositions = new Set<string>();
  safePositions.add(`${safeRow},${safeCol}`);
  for (const [nr, nc] of getNeighbors(safeRow, safeCol, rows, cols)) {
    safePositions.add(`${nr},${nc}`);
  }

  const possiblePositions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safePositions.has(`${r},${c}`)) {
        possiblePositions.push([r, c]);
      }
    }
  }

  for (let i = possiblePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
  }

  const minePositions = possiblePositions.slice(0, Math.min(mineCount, possiblePositions.length));

  for (const [r, c] of minePositions) {
    newBoard[r][c].isMine = true;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
          if (newBoard[nr][nc].isMine) count++;
        }
        newBoard[r][c].adjacentMines = count;
      }
    }
  }

  return newBoard;
}

function revealCell(
  board: CellState[][],
  row: number,
  col: number,
  rows: number,
  cols: number
): CellState[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;

    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue;

    newBoard[r][c].isRevealed = true;

    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
          stack.push([nr, nc]);
        }
      }
    }
  }

  return newBoard;
}

function checkWin(board: CellState[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

function revealAllMines(board: CellState[][]): CellState[][] {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      isRevealed: cell.isMine ? true : cell.isRevealed,
    }))
  );
}

export function useMinesweeper(config: GameConfig) {
  const { rows, cols, mines } = config;

  const [board, setBoard] = useState<CellState[][]>(() => createEmptyBoard(rows, cols));
  const [gameState, setGameState] = useState<GameState>('idle');
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [configKey, setConfigKey] = useState(`${rows}-${cols}-${mines}`);
  const [explodedCell, setExplodedCell] = useState<[number, number] | undefined>(undefined);

  const currentConfigKey = `${rows}-${cols}-${mines}`;
  if (currentConfigKey !== configKey) {
    setBoard(createEmptyBoard(rows, cols));
    setGameState('idle');
    setMinesPlaced(false);
    setFlagCount(0);
    setTime(0);
    setConfigKey(currentConfigKey);
    setExplodedCell(undefined);
  }

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard(rows, cols));
    setGameState('idle');
    setMinesPlaced(false);
    setExplodedCell(undefined);
    setFlagCount(0);
    setTime(0);
  }, [rows, cols]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return;

    let currentBoard = board;

    if (!minesPlaced) {
      currentBoard = placeMines(board, rows, cols, mines, row, col);
      setMinesPlaced(true);
      setGameState('playing');
    }

    const cell = currentBoard[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      setExplodedCell([row, col]);
      setBoard(revealAllMines(currentBoard));
      setGameState('lost');
      return;
    }

    const newBoard = revealCell(currentBoard, row, col, rows, cols);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setGameState('won');
    }
  }, [board, gameState, minesPlaced, rows, cols, mines]);

  const handleCellRightClick = useCallback((row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (gameState === 'idle') return;

    const cell = board[row][col];
    if (cell.isRevealed) return;

    setBoard(prev => {
      const newBoard = prev.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
      return newBoard;
    });

    setFlagCount(prev => (cell.isFlagged ? prev - 1 : prev + 1));
  }, [board, gameState]);

  const handleChordClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return;

    const cell = board[row][col];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;

    const neighbors = getNeighbors(row, col, rows, cols);
    const flaggedCount = neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;

    if (flaggedCount !== cell.adjacentMines) return;

    let newBoard = board.map(r => r.map(c => ({ ...c })));
    let hitMine = false;
    let hitMineCell: [number, number] | undefined;

    for (const [nr, nc] of neighbors) {
      const neighbor = newBoard[nr][nc];
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        if (neighbor.isMine) {
          hitMine = true;
          hitMineCell = hitMineCell ?? [nr, nc];
        } else {
          newBoard = revealCell(newBoard, nr, nc, rows, cols);
        }
      }
    }

    if (hitMine) {
      setBoard(revealAllMines(newBoard));
      setGameState('lost');
      if (hitMineCell) setExplodedCell(hitMineCell);
      return;
    }

    setBoard(newBoard);
    if (checkWin(newBoard)) {
      setGameState('won');
    }
  }, [board, gameState, rows, cols]);

  return {
    board,
    gameState,
    flagCount,
    minesRemaining: mines - flagCount,
    time,
    explodedCell,
    handleCellClick,
    handleCellRightClick,
    handleChordClick,
    resetGame,
  };
}

