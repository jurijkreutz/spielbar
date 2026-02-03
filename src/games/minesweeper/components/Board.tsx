'use client';

import { useState, useEffect } from 'react';
import type { CellState, GameState } from '../types/minesweeper';
import { Cell } from './Cell';

type BoardProps = {
  board: CellState[][];
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  onChordClick: (row: number, col: number) => void;
  highlightedCells?: Set<string>;
  proofTargetCell?: [number, number];
  proofType?: 'safe' | 'mine' | 'guess';
  explodedCell?: [number, number];
};

export function Board({
  board,
  gameState,
  onCellClick,
  onCellRightClick,
  onChordClick,
  highlightedCells,
  proofTargetCell,
  proofType,
  explodedCell,
}: BoardProps) {
  const gameOver = gameState === 'won' || gameState === 'lost';
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [justRevealedCells, setJustRevealedCells] = useState<Set<string>>(new Set());

  // Track newly revealed cells for animation
  useEffect(() => {
    const currentRevealed = new Set<string>();
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.isRevealed) {
          currentRevealed.add(`${r},${c}`);
        }
      });
    });

    // Find cells that were just revealed
    const newlyRevealed = new Set<string>();
    currentRevealed.forEach(key => {
      if (!revealedCells.has(key)) {
        newlyRevealed.add(key);
      }
    });

    if (newlyRevealed.size > 0) {
      setJustRevealedCells(newlyRevealed);
      // Clear after animation
      const timer = setTimeout(() => {
        setJustRevealedCells(new Set());
      }, 350);
      setRevealedCells(currentRevealed);
      return () => clearTimeout(timer);
    }

    setRevealedCells(currentRevealed);
  }, [board]);

  // Win celebration animation
  useEffect(() => {
    if (gameState === 'won') {
      setShowWinCelebration(true);
      const timer = setTimeout(() => setShowWinCelebration(false), 600);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (
    <div
      className={`inline-block p-1.5 rounded-lg bg-gradient-to-br from-zinc-400 to-zinc-500 shadow-lg ${
        showWinCelebration ? 'win-celebration' : ''
      }`}
      role="grid"
      aria-label="Minesweeper board"
    >
      <div className="bg-zinc-300/50 p-0.5 rounded">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex" role="row">
            {row.map((cell, colIndex) => {
              const cellKey = `${rowIndex},${colIndex}`;
              const isHighlighted = highlightedCells?.has(cellKey) ?? false;
              const isProofTarget = proofTargetCell?.[0] === rowIndex && proofTargetCell?.[1] === colIndex;
              const isExploded = explodedCell?.[0] === rowIndex && explodedCell?.[1] === colIndex;
              const justRevealed = justRevealedCells.has(cellKey);

              return (
                <Cell
                  key={cellKey}
                  cell={cell}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  onRightClick={() => onCellRightClick(rowIndex, colIndex)}
                  onMiddleClick={() => onChordClick(rowIndex, colIndex)}
                  gameOver={gameOver}
                  isHighlighted={isHighlighted}
                  isProofTarget={isProofTarget}
                  proofType={isProofTarget ? proofType : undefined}
                  isExploded={isExploded}
                  justRevealed={justRevealed}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
