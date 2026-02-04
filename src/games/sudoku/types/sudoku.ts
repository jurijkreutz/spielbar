// Sudoku Game Types

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CellState = {
  value: CellValue;
  isGiven: boolean; // Vom Puzzle vorgegeben
  isError: boolean; // Konflikt mit anderen Zellen
  notes: Set<number>; // Notizen/Kandidaten (1-9)
};

export type GameState = 'idle' | 'playing' | 'won';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SudokuBoard = CellState[][];

export type Position = {
  row: number;
  col: number;
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { clues: number; name: string; description: string }> = {
  easy: { clues: 38, name: 'Easy', description: 'Entspannt, einsteigerfreundlich' },
  medium: { clues: 30, name: 'Medium', description: 'Ausgewogen, Denkspiel für jeden Tag' },
  hard: { clues: 24, name: 'Hard', description: 'Anspruchsvoll, logisch fordernd' },
};

export type BestTimes = Partial<Record<Difficulty, number>>;

// Validierung: Prüft ob eine Zahl in einer Position gültig ist
export function isValidPlacement(
  board: SudokuBoard,
  row: number,
  col: number,
  num: number
): boolean {
  // Zeile prüfen
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === num) {
      return false;
    }
  }

  // Spalte prüfen
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === num) {
      return false;
    }
  }

  // 3x3 Box prüfen
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === num) {
        return false;
      }
    }
  }

  return true;
}

// Prüft ob das Board vollständig und korrekt gelöst ist
export function isBoardComplete(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c];
      if (cell.value === 0) return false;
      if (!isValidPlacement(board, r, c, cell.value)) return false;
    }
  }
  return true;
}

// Findet alle Konflikte im Board und markiert sie
export function findConflicts(board: SudokuBoard): Set<string> {
  const conflicts = new Set<string>();

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = board[r][c].value;
      if (value === 0) continue;

      // Zeile prüfen
      for (let cc = 0; cc < 9; cc++) {
        if (cc !== c && board[r][cc].value === value) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${cc}`);
        }
      }

      // Spalte prüfen
      for (let rr = 0; rr < 9; rr++) {
        if (rr !== r && board[rr][c].value === value) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${rr},${c}`);
        }
      }

      // 3x3 Box prüfen
      const boxRow = Math.floor(r / 3) * 3;
      const boxCol = Math.floor(c / 3) * 3;
      for (let rr = boxRow; rr < boxRow + 3; rr++) {
        for (let cc = boxCol; cc < boxCol + 3; cc++) {
          if ((rr !== r || cc !== c) && board[rr][cc].value === value) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${rr},${cc}`);
          }
        }
      }
    }
  }

  return conflicts;
}

