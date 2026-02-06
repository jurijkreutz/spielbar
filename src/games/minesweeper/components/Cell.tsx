'use client';

import { memo, useState, useEffect } from 'react';
import type { CellState } from '../types/minesweeper';

// Verbesserte Zahlenfarben mit mehr Sättigung
const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-emerald-600',
  3: 'text-red-500',
  4: 'text-purple-600',
  5: 'text-amber-600',
  6: 'text-cyan-600',
  7: 'text-zinc-700',
  8: 'text-zinc-500',
};

type CellProps = {
  cell: CellState;
  onClick: () => void;
  onRightClick: () => void;
  onMiddleClick: () => void;
  size?: number;
  gameOver: boolean;
  isHighlighted?: boolean;
  isProofTarget?: boolean;
  proofType?: 'safe' | 'mine' | 'guess';
  isExploded?: boolean;
  justRevealed?: boolean;
};

export const Cell = memo(function Cell({
  cell,
  onClick,
  onRightClick,
  onMiddleClick,
  size = 28,
  gameOver,
  isHighlighted = false,
  isProofTarget = false,
  proofType,
  isExploded = false,
  justRevealed = false,
}: CellProps) {
  const [showFlagAnimation, setShowFlagAnimation] = useState(false);
  const [showRevealPulse, setShowRevealPulse] = useState(false);

  // Flag animation trigger
  useEffect(() => {
    if (cell.isFlagged) {
      setShowFlagAnimation(true);
      const timer = setTimeout(() => setShowFlagAnimation(false), 200);
      return () => clearTimeout(timer);
    }
  }, [cell.isFlagged]);

  // Reveal pulse trigger
  useEffect(() => {
    if (justRevealed) {
      setShowRevealPulse(true);
      const timer = setTimeout(() => setShowRevealPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [justRevealed]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onRightClick();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      onMiddleClick();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      onMiddleClick();
    } else {
      onClick();
    }
  };

  const handleDoubleClick = () => {
    onMiddleClick();
  };

  const baseClasses =
    'flex items-center justify-center font-bold select-none transition-all duration-100';
  const cellStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.max(12, Math.round(size * 0.5))}px`,
    lineHeight: 1,
  } as const;

  // Proof mode highlighting
  const getProofClasses = () => {
    if (isProofTarget) {
      if (proofType === 'safe') return 'proof-safe-glow';
      if (proofType === 'mine') return 'proof-mine-glow';
      return 'ring-2 ring-amber-400 ring-offset-1 animate-pulse';
    }
    if (isHighlighted) {
      return 'ring-2 ring-amber-300 ring-offset-1';
    }
    return '';
  };

  // Verdeckte Zelle
  if (!cell.isRevealed) {
    return (
      <button
        className={`${baseClasses} cell-hidden cursor-pointer ${getProofClasses()}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        disabled={gameOver}
        aria-label={cell.isFlagged ? 'Flagged cell' : 'Hidden cell'}
        style={cellStyle}
      >
        {cell.isFlagged && (
          <span
            className={`cell-flag ${showFlagAnimation ? 'flag-plant' : ''}`}
            aria-hidden="true"
          >
            🚩
          </span>
        )}
      </button>
    );
  }

  // Mine
  if (cell.isMine) {
    return (
      <div
        className={`${baseClasses} ${isExploded ? 'cell-mine-exploded mine-explode' : 'cell-mine'} ${getProofClasses()}`}
        aria-label="Mine"
        style={cellStyle}
      >
        <span style={{ fontSize: `${Math.max(14, Math.round(size * 0.62))}px` }} aria-hidden="true">💣</span>
      </div>
    );
  }

  // Aufgedeckte Zelle
  return (
    <button
      className={`${baseClasses} cell-revealed cursor-default ${
        cell.adjacentMines > 0 ? `${NUMBER_COLORS[cell.adjacentMines]} cell-number` : ''
      } ${getProofClasses()} ${showRevealPulse ? 'cell-reveal-pulse' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={cellStyle}
      aria-label={
        cell.adjacentMines > 0
          ? `${cell.adjacentMines} adjacent mines`
          : 'Empty cell'
      }
    >
      {cell.adjacentMines > 0 && cell.adjacentMines}
    </button>
  );
});
