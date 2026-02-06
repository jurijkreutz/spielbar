/**
 * Tests für Sudoku Validatoren
 *
 * Prüft:
 * - isValidPlacement: Zeilen-, Spalten- und Box-Constraints
 * - isBoardComplete: vollständiges Board erkennen
 * - findConflicts: alle Konflikte korrekt markieren
 * - Edge Cases: leeres Board, teilweise gefüllt
 */

import { isValidPlacement, isBoardComplete, findConflicts } from '../types/sudoku';
import type { SudokuBoard, CellValue } from '../types/sudoku';

function createEmptyBoard(): SudokuBoard {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      value: 0 as CellValue,
      isGiven: false,
      isError: false,
      notes: new Set<number>(),
    }))
  );
}

function setBoardValue(board: SudokuBoard, row: number, col: number, value: CellValue) {
  board[row][col].value = value;
}

// Ein bekanntes gültiges Sudoku
const VALID_SOLUTION: CellValue[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

function createSolvedBoard(): SudokuBoard {
  return VALID_SOLUTION.map((row) =>
    row.map((value) => ({
      value: value as CellValue,
      isGiven: true,
      isError: false,
      notes: new Set<number>(),
    }))
  );
}

describe('isValidPlacement', () => {
  describe('Zeilen-Constraint', () => {
    it('erlaubt Platzierung wenn Zahl nicht in Zeile existiert', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 1);
      expect(isValidPlacement(board, 0, 5, 2)).toBe(true);
    });

    it('verbietet Platzierung wenn Zahl in Zeile existiert', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 5);
      expect(isValidPlacement(board, 0, 5, 5)).toBe(false);
    });
  });

  describe('Spalten-Constraint', () => {
    it('erlaubt Platzierung wenn Zahl nicht in Spalte existiert', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 1);
      expect(isValidPlacement(board, 5, 0, 2)).toBe(true);
    });

    it('verbietet Platzierung wenn Zahl in Spalte existiert', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 5);
      expect(isValidPlacement(board, 5, 0, 5)).toBe(false);
    });
  });

  describe('3x3-Box-Constraint', () => {
    it('erlaubt Platzierung wenn Zahl nicht in Box existiert', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 1);
      expect(isValidPlacement(board, 1, 1, 2)).toBe(true);
    });

    it('verbietet Platzierung wenn Zahl in Box existiert', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 5);
      expect(isValidPlacement(board, 1, 1, 5)).toBe(false);
    });

    it('erlaubt gleiche Zahl in verschiedenen Boxen', () => {
      const board = createEmptyBoard();
      setBoardValue(board, 0, 0, 5);
      // (3, 3) ist in einer anderen Box
      expect(isValidPlacement(board, 3, 3, 5)).toBe(true);
    });
  });

  it('erlaubt Platzierung auf leerem Board', () => {
    const board = createEmptyBoard();
    for (let num = 1; num <= 9; num++) {
      expect(isValidPlacement(board, 0, 0, num)).toBe(true);
    }
  });

  it('prüft nur gegen andere Zellen (nicht eigene Position)', () => {
    const board = createEmptyBoard();
    setBoardValue(board, 4, 4, 7);
    // Die Zelle (4,4) hat bereits 7 -> isValidPlacement prüft (r !== row || c !== col)
    expect(isValidPlacement(board, 4, 4, 7)).toBe(true);
  });
});

describe('isBoardComplete', () => {
  it('erkennt vollständig gelöstes Board', () => {
    const board = createSolvedBoard();
    expect(isBoardComplete(board)).toBe(true);
  });

  it('gibt false für leeres Board', () => {
    const board = createEmptyBoard();
    expect(isBoardComplete(board)).toBe(false);
  });

  it('gibt false für teilweise gefülltes Board', () => {
    const board = createSolvedBoard();
    board[4][4].value = 0;
    expect(isBoardComplete(board)).toBe(false);
  });

  it('gibt false für Board mit Konflikten', () => {
    const board = createSolvedBoard();
    // Ändere eine Zelle zu einem ungültigen Wert
    board[0][0].value = board[0][1].value; // Doppelt in Zeile
    expect(isBoardComplete(board)).toBe(false);
  });
});

describe('findConflicts', () => {
  it('gibt leeres Set für leeres Board zurück', () => {
    const board = createEmptyBoard();
    expect(findConflicts(board).size).toBe(0);
  });

  it('gibt leeres Set für gelöstes Board zurück', () => {
    const board = createSolvedBoard();
    expect(findConflicts(board).size).toBe(0);
  });

  it('findet Zeilen-Konflikte', () => {
    const board = createEmptyBoard();
    setBoardValue(board, 0, 0, 5);
    setBoardValue(board, 0, 5, 5);

    const conflicts = findConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,5')).toBe(true);
  });

  it('findet Spalten-Konflikte', () => {
    const board = createEmptyBoard();
    setBoardValue(board, 0, 0, 3);
    setBoardValue(board, 5, 0, 3);

    const conflicts = findConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('5,0')).toBe(true);
  });

  it('findet Box-Konflikte', () => {
    const board = createEmptyBoard();
    setBoardValue(board, 0, 0, 8);
    setBoardValue(board, 2, 2, 8);

    const conflicts = findConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('2,2')).toBe(true);
  });

  it('markiert alle beteiligten Zellen bei Mehrfach-Konflikten', () => {
    const board = createEmptyBoard();
    setBoardValue(board, 0, 0, 5);
    setBoardValue(board, 0, 3, 5);
    setBoardValue(board, 0, 7, 5);

    const conflicts = findConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,3')).toBe(true);
    expect(conflicts.has('0,7')).toBe(true);
  });
});
