'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Board } from './Board';
import { findProof, type ProofResult } from '../lib/proofSolver';
import { createBoardFromPositions, getTodayDateString } from '../lib/dailyBoard';
import { analytics, setDailyCompleted } from '@/lib/analytics';
import { Loader } from '@/components/platform/Loader';
import { InfoTooltip } from '@/components/platform/InfoTooltip';
import { TrackedLink } from '@/components/platform/TrackedLink';
import type { CellState, GameState } from '../types/minesweeper';

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

type DailyBoardData = {
  date: string;
  rows: number;
  cols: number;
  mines: number;
  minePositions: [number, number][];
  difficulty: string;
  verified: boolean;
  attempt: {
    completed: boolean;
    won: boolean;
    time: number | null;
    moves: number | null;
    usedHints: boolean;
  } | null;
};

export function DailyGame() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyBoardData | null>(null);
  const [board, setBoard] = useState<CellState[][] | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [usedHints, setUsedHints] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Proof hint state
  const [currentProof, setCurrentProof] = useState<ProofResult | null>(null);
  const [showProofHint, setShowProofHint] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  const playerId = typeof window !== 'undefined' ? getPlayerId() : '';

  // Load daily board
  useEffect(() => {
    async function loadDaily() {
      try {
        setLoading(true);
        const date = getTodayDateString();
        const res = await fetch(`/api/daily?date=${date}&playerId=${playerId}`);

        if (!res.ok) {
          throw new Error('Fehler beim Laden');
        }

        const data: DailyBoardData = await res.json();
        setDailyData(data);

        // Check if already completed
        if (data.attempt?.completed) {
          setAlreadyCompleted(true);
          setGameState(data.attempt.won ? 'won' : 'lost');
          if (data.attempt.time) setTime(data.attempt.time);
          if (data.attempt.moves) setMoves(data.attempt.moves);
          if (data.attempt.usedHints) setUsedHints(true);
        }

        // Create board
        const newBoard = createBoardFromPositions(data.rows, data.cols, data.minePositions);
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
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Available proof
  const availableProof = useMemo(() => {
    if (!board || gameState !== 'playing') return null;
    return findProof(board);
  }, [board, gameState]);

  // Calculate mines remaining
  const minesRemaining = useMemo(() => {
    if (!board || !dailyData) return 0;
    const flagCount = board.flat().filter(c => c.isFlagged).length;
    return dailyData.mines - flagCount;
  }, [board, dailyData]);

  // Save attempt to server
  const saveAttempt = useCallback(async (won: boolean) => {
    if (!dailyData || alreadyCompleted) return;

    // Track analytics (Ticket 7.1)
    analytics.trackGameEnd('minesweeper', 'daily', won ? 'win' : 'lose', time);
    if (won) {
      analytics.trackDailyComplete('minesweeper', time, moves, usedHints);
      setDailyCompleted('minesweeper', { time, usedHints });
    }

    try {
      await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dailyData.date,
          playerId,
          completed: true,
          won,
          time,
          moves,
          usedHints,
        }),
      });
    } catch (err) {
      console.error('Error saving attempt:', err);
    }
  }, [dailyData, playerId, time, moves, usedHints, alreadyCompleted]);

  // Check win condition
  const checkWin = useCallback((currentBoard: CellState[][]): boolean => {
    for (const row of currentBoard) {
      for (const cell of row) {
        if (!cell.isMine && !cell.isRevealed) {
          return false;
        }
      }
    }
    return true;
  }, []);

  // Reveal cell (with flood fill for zeros)
  const revealCell = useCallback((currentBoard: CellState[][], row: number, col: number): CellState[][] => {
    if (!dailyData) return currentBoard;

    const rows = dailyData.rows;
    const cols = dailyData.cols;
    const newBoard = currentBoard.map(r => r.map(c => ({ ...c })));
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
  }, [dailyData]);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!board || !dailyData || gameState === 'won' || gameState === 'lost' || alreadyCompleted) return;

    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    // Start game if idle
    if (gameState === 'idle') {
      setGameState('playing');
      // Track game start (Ticket 7.1)
      analytics.trackGameStart('minesweeper', 'daily', {
        name: 'Daily Logic Board',
        href: '/games/minesweeper/daily',
      });
    }

    setMoves(m => m + 1);
    setShowProofHint(false);
    setHighlightedCells(new Set());

    if (cell.isMine) {
      // Game Over
      const revealedBoard = board.map(r => r.map(c => ({
        ...c,
        isRevealed: c.isMine ? true : c.isRevealed,
      })));
      setBoard(revealedBoard);
      setGameState('lost');
      saveAttempt(false);
      return;
    }

    const newBoard = revealCell(board, row, col);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setGameState('won');
      saveAttempt(true);
    }
  }, [board, dailyData, gameState, alreadyCompleted, revealCell, checkWin, saveAttempt]);

  // Handle right click (flag)
  const handleCellRightClick = useCallback((row: number, col: number) => {
    if (!board || gameState === 'won' || gameState === 'lost' || alreadyCompleted) return;

    const cell = board[row][col];
    if (cell.isRevealed) return;

    if (gameState === 'idle') {
      setGameState('playing');
    }

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
    setMoves(m => m + 1);
    setShowProofHint(false);
    setHighlightedCells(new Set());
  }, [board, gameState, alreadyCompleted]);

  // Handle chord click
  const handleChordClick = useCallback((row: number, col: number) => {
    if (!board || !dailyData || gameState !== 'playing' || alreadyCompleted) return;

    const cell = board[row][col];
    if (!cell.isRevealed || cell.adjacentMines === 0) return;

    const neighbors = getNeighbors(row, col, dailyData.rows, dailyData.cols);
    const flaggedCount = neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;

    if (flaggedCount !== cell.adjacentMines) return;

    let newBoard = board.map(r => r.map(c => ({ ...c })));
    let hitMine = false;
    let mineCell: [number, number] | null = null;

    for (const [nr, nc] of neighbors) {
      if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
        if (newBoard[nr][nc].isMine) {
          hitMine = true;
          mineCell = [nr, nc];
        } else {
          newBoard = revealCell(newBoard, nr, nc);
        }
      }
    }

    if (hitMine && mineCell) {
      newBoard = newBoard.map(r => r.map(c => ({
        ...c,
        isRevealed: c.isMine ? true : c.isRevealed,
      })));
      setBoard(newBoard);
      setGameState('lost');
      saveAttempt(false);
      return;
    }

    setBoard(newBoard);
    setMoves(m => m + 1);

    if (checkWin(newBoard)) {
      setGameState('won');
      saveAttempt(true);
    }
  }, [board, dailyData, gameState, alreadyCompleted, revealCell, checkWin, saveAttempt]);

  // Handle proof request
  const handleProofRequest = useCallback(() => {
    if (availableProof && !alreadyCompleted) {
      setCurrentProof(availableProof);
      setShowProofHint(true);
      setUsedHints(true);

      const cells = new Set<string>();
      cells.add(`${availableProof.row},${availableProof.col}`);
      if (availableProof.involvedCells) {
        availableProof.involvedCells.forEach(([r, c]) => cells.add(`${r},${c}`));
      }
      setHighlightedCells(cells);

      setTimeout(() => {
        setShowProofHint(false);
        setHighlightedCells(new Set());
      }, 5000);
    }
  }, [availableProof, alreadyCompleted]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  // Difficulty labels
  const difficultyLabels: Record<string, string> = {
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
  };

  if (loading) {
    return (
      <Loader className="py-16" />
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!board || !dailyData) {
    return null;
  }

  const resultStatus = gameState === 'won'
    ? (usedHints ? 'Solved with Hints' : 'Clean Solve')
    : gameState === 'lost'
    ? 'Nicht geschafft'
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* Daily Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-2">
          📅 Heute
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Daily Logic Board</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {new Date(dailyData.date).toLocaleDateString('de-AT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          {' • '}
          <span className={`font-medium ${
            dailyData.difficulty === 'easy' ? 'text-green-600' :
            dailyData.difficulty === 'medium' ? 'text-amber-600' : 'text-red-600'
          }`}>
            {difficultyLabels[dailyData.difficulty] || dailyData.difficulty}
          </span>
        </p>
        {dailyData.verified && (
          <p className="text-xs text-emerald-600 mt-1">
            ✓ Garantiert logisch lösbar
          </p>
        )}
      </div>

      {/* Game Stats Bar */}
      <div className="flex items-center gap-6 mb-4 px-4 py-2 bg-zinc-100 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-zinc-500">Minen</p>
          <p className="font-mono font-bold text-zinc-900">{minesRemaining}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500">Zeit</p>
          <p className="font-mono font-bold text-zinc-900">{formatTime(time)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500">Züge</p>
          <p className="font-mono font-bold text-zinc-900">{moves}</p>
        </div>
      </div>

      {/* Already Completed Notice */}
      {alreadyCompleted && (
        <div className="mb-4 px-4 py-2 bg-zinc-200 text-zinc-700 rounded-lg text-sm">
          Du hast das heutige Board bereits gespielt.
        </div>
      )}

      {/* Proof Button */}
      {gameState === 'playing' && !alreadyCompleted && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleProofRequest}
              disabled={!availableProof}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                availableProof
                  ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              } ${usedHints ? 'ring-1 ring-amber-400' : ''}`}
              title={availableProof ? 'Zeigt einen logisch beweisbaren Zug' : 'Kein logischer Beweis verfügbar'}
            >
              🔍 Hinweis {usedHints && <span className="text-amber-300 ml-1">•</span>}
            </button>

            {/* Proof Hint Popup */}
            {showProofHint && currentProof && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-zinc-800 text-white text-sm rounded-lg shadow-lg z-10">
                <p className="font-medium mb-1">
                  {currentProof.type === 'safe' ? '✓ Sicheres Feld' : '⚠ Mine erkannt'}
                </p>
                <p className="text-zinc-300 text-xs">{currentProof.reason}</p>
              </div>
            )}
          </div>
          <InfoTooltip
            tooltipId="minesweeper-proof"
            text="Zeigt dir Züge, die logisch sicher sind."
          />
        </div>
      )}

      {/* Board */}
      <Board
        board={board}
        gameState={gameState}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
        onChordClick={handleChordClick}
        highlightedCells={highlightedCells}
        proofTargetCell={showProofHint && currentProof ? [currentProof.row, currentProof.col] : undefined}
      />

      {/* Result (Ticket 4.1 - Konsistente Endstates) */}
      {(gameState === 'won' || gameState === 'lost') && (
        <div className={`mt-6 p-6 rounded-xl text-center ${
          gameState === 'won' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-lg font-bold ${gameState === 'won' ? 'text-emerald-700' : 'text-red-700'}`}>
            {gameState === 'won' ? '🎉 Nice. Runde geschafft.' : '💥 Runde vorbei.'}
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm">
            <span className="text-zinc-600">Zeit: <strong>{formatTime(time)}</strong></span>
            <span className="text-zinc-600">Züge: <strong>{moves}</strong></span>
          </div>
          {resultStatus && (
            <p className={`mt-2 text-sm font-medium ${
              resultStatus === 'Clean Solve' ? 'text-emerald-600' :
              resultStatus === 'Solved with Hints' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {resultStatus === 'Clean Solve' && '✨ '}
              {resultStatus}
            </p>
          )}

          {/* Daily Complete Message */}
          <p className="mt-3 text-sm text-zinc-600">
            Für heute erledigt.
          </p>
          <p className="text-xs text-zinc-400">
            Morgen gibt&apos;s das nächste Rätsel.
          </p>

          {/* Next Actions (Ticket 4.1) */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <TrackedLink
              href="/"
              tracking={{ type: 'game_exit_to_overview', from: 'minesweeper-daily' }}
              className="px-6 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors text-center"
            >
              Alle Spiele
            </TrackedLink>
            <a
              href="/games/sudoku/daily"
              className="px-6 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Daily Sudoku spielen
            </a>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-xs text-zinc-400 text-center max-w-md">
        <p>
          {gameState === 'idle' && !alreadyCompleted && 'Klicke auf ein Feld, um zu starten.'}
          {gameState === 'playing' && 'Linksklick = aufdecken • Rechtsklick = Flagge'}
        </p>
        {!alreadyCompleted && gameState !== 'won' && gameState !== 'lost' && (
          <p className="mt-1 text-amber-600">
            ⚠️ Kein Neustart möglich – überlege jeden Zug!
          </p>
        )}
      </div>
    </div>
  );
}
