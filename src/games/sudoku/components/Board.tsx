'use client';

import { useMemo } from 'react';
import type { SudokuBoard, Position } from '../types/sudoku';
import { findConflicts } from '../types/sudoku';
import { Cell } from './Cell';

type BoardProps = {
  board: SudokuBoard;
  selectedCell: Position | null;
  onCellClick: (row: number, col: number) => void;
  gameOver: boolean;
};

export function Board({ board, selectedCell, onCellClick, gameOver }: BoardProps) {
  // Finde alle Konflikte
  const conflicts = useMemo(() => findConflicts(board), [board]);

  // Bestimme die ausgewählte Zahl
  const selectedValue = useMemo(() => {
    if (!selectedCell) return 0;
    return board[selectedCell.row][selectedCell.col].value;
  }, [selectedCell, board]);

  return (
    <div
      className="inline-block p-1 sm:p-1.5 rounded-lg bg-zinc-300 dark:bg-zinc-600 shadow-lg"
      role="grid"
      aria-label="Sudoku board"
    >
      <div className="grid grid-cols-9 border-2 border-zinc-400 dark:border-zinc-500 rounded overflow-hidden">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

            // Gleiche Zeile, Spalte oder 3x3 Box
            const isHighlighted = selectedCell
              ? (selectedCell.row === rowIndex ||
                 selectedCell.col === colIndex ||
                 (Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3)))
              : false;

            // Gleiche Zahl wie ausgewählt
            const isSameNumber = selectedValue !== 0 && cell.value === selectedValue && !isSelected;

            // Konflikt
            const isConflict = conflicts.has(`${rowIndex},${colIndex}`);

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                isSelected={isSelected}
                isHighlighted={isHighlighted && !isSelected}
                isSameNumber={isSameNumber}
                isConflict={isConflict}
                onClick={() => onCellClick(rowIndex, colIndex)}
                gameOver={gameOver}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
