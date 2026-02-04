'use client';

import { memo } from 'react';
import type { CellState } from '../types/sudoku';

type CellProps = {
  cell: CellState;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean; // Gleiche Zeile/Spalte/Box
  isSameNumber: boolean; // Gleiche Zahl wie ausgewählt
  isConflict: boolean;
  onClick: () => void;
  gameOver: boolean;
};

export const Cell = memo(function Cell({
  cell,
  row,
  col,
  isSelected,
  isHighlighted,
  isSameNumber,
  isConflict,
  onClick,
  gameOver,
}: CellProps) {
  // Border-Klassen für 3x3 Box-Trennung
  const borderClasses = [
    col % 3 === 0 && col !== 0 ? 'border-l-2 border-l-zinc-400 dark:border-l-zinc-500' : '',
    row % 3 === 0 && row !== 0 ? 'border-t-2 border-t-zinc-400 dark:border-t-zinc-500' : '',
  ].filter(Boolean).join(' ');

  // Hintergrund-Klassen
  const getBgClass = () => {
    if (isSelected) {
      return 'bg-blue-200 dark:bg-blue-800';
    }
    if (isSameNumber && cell.value !== 0) {
      return 'bg-blue-100 dark:bg-blue-900/50';
    }
    if (isHighlighted) {
      return 'bg-zinc-100 dark:bg-zinc-800';
    }
    return 'bg-white dark:bg-zinc-900';
  };

  // Text-Klassen
  const getTextClass = () => {
    if (isConflict) {
      return 'text-red-500 dark:text-red-400';
    }
    if (cell.isGiven) {
      return 'text-zinc-900 dark:text-zinc-100 font-bold';
    }
    return 'text-blue-600 dark:text-blue-400 font-medium';
  };

  return (
    <button
      className={`
        relative w-10 h-10 sm:w-12 sm:h-12
        flex items-center justify-center
        text-xl sm:text-2xl
        border border-zinc-200 dark:border-zinc-700
        transition-colors duration-100
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
        ${borderClasses}
        ${getBgClass()}
        ${getTextClass()}
        ${!gameOver && !cell.isGiven ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800' : ''}
        ${cell.isGiven ? 'cursor-default' : ''}
        select-none
      `}
      onClick={onClick}
      disabled={gameOver}
      aria-label={`Zelle ${row + 1}, ${col + 1}${cell.value ? `, Wert ${cell.value}` : ', leer'}`}
    >
      {/* Wert oder Notizen */}
      {cell.value !== 0 ? (
        <span className={isConflict ? 'animate-pulse' : ''}>
          {cell.value}
        </span>
      ) : cell.notes.size > 0 ? (
        <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <span
              key={n}
              className={`
                text-[8px] sm:text-[10px] leading-none
                flex items-center justify-center
                ${cell.notes.has(n) ? 'text-zinc-500 dark:text-zinc-400' : 'text-transparent'}
              `}
            >
              {n}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
});

