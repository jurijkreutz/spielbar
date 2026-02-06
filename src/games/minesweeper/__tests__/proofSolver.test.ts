/**
 * Tests für den Proof Solver (Minesweeper)
 *
 * Prüft:
 * - findProof: sichere Zellen, Minen-Identifikation, null bei Ambiguität
 * - findAllSafeMoves: alle sicheren Züge
 * - findAllMines: alle erkennbaren Minen
 * - analyzeMistake: Fehleranalyse
 */

import { findProof, findAllSafeMoves, findAllMines, analyzeMistake, hasLogicalMove } from '../lib/proofSolver';
import type { CellState } from '../types/minesweeper';

function createCell(overrides: Partial<CellState> = {}): CellState {
  return {
    isMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0,
    ...overrides,
  };
}

function createEmptyBoard(rows: number, cols: number): CellState[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createCell())
  );
}

describe('findProof', () => {
  describe('Strategie 1: Einfaches Zählen', () => {
    it('findet sichere Zellen wenn alle Minen geflaggt sind', () => {
      // 3x3 Board: Mine bei (0,0) geflaggt, Zahl "1" bei (0,1) aufgedeckt
      // -> (0,2) und benachbarte hidden Zellen sind sicher
      const board = createEmptyBoard(3, 3);
      board[0][0] = createCell({ isMine: true, isFlagged: true });
      board[0][1] = createCell({ isRevealed: true, adjacentMines: 1 });
      board[1][0] = createCell(); // hidden
      board[1][1] = createCell(); // hidden

      const proof = findProof(board);
      expect(proof).not.toBeNull();
      expect(proof!.type).toBe('safe');
    });

    it('identifiziert Minen wenn alle Hidden-Zellen Minen sein müssen', () => {
      // 3x3 Board: Zahl "1" bei (0,0) aufgedeckt, nur 1 hidden Nachbar
      const board = createEmptyBoard(3, 3);
      board[0][0] = createCell({ isRevealed: true, adjacentMines: 1 });
      board[0][1] = createCell({ isRevealed: true, adjacentMines: 0 });
      board[1][0] = createCell({ isRevealed: true, adjacentMines: 0 });
      // (1,1) ist der einzige hidden Nachbar -> muss Mine sein
      board[1][1] = createCell({ isMine: true });

      const proof = findProof(board);
      expect(proof).not.toBeNull();
      expect(proof!.type).toBe('mine');
      expect(proof!.row).toBe(1);
      expect(proof!.col).toBe(1);
    });
  });

  it('gibt null zurück bei leerem Board', () => {
    const board = createEmptyBoard(3, 3);
    expect(findProof(board)).toBeNull();
  });

  it('gibt null zurück bei Board mit 0 Zeilen', () => {
    expect(findProof([])).toBeNull();
  });

  it('gibt null zurück wenn kein logischer Zug möglich ist', () => {
    // Board wo die Situation ambig ist
    const board = createEmptyBoard(3, 3);
    board[0][0] = createCell({ isRevealed: true, adjacentMines: 1 });
    // Zwei hidden Nachbarn, nur 1 Mine -> ambig
    // (0,1), (1,0), (1,1) sind hidden

    const proof = findProof(board);
    // Könnte null oder eine Subset-Analyse geben, je nach Konfiguration
    // Bei 3 hidden Nachbarn und 1 Mine -> ambig
    expect(proof).toBeNull();
  });

  it('enthält Begründung in der Rückgabe', () => {
    const board = createEmptyBoard(3, 3);
    board[0][0] = createCell({ isRevealed: true, adjacentMines: 1 });
    board[0][1] = createCell({ isRevealed: true, adjacentMines: 0 });
    board[1][0] = createCell({ isRevealed: true, adjacentMines: 0 });
    board[1][1] = createCell({ isMine: true });

    const proof = findProof(board);
    expect(proof).not.toBeNull();
    expect(proof!.reason).toBeTruthy();
    expect(typeof proof!.reason).toBe('string');
  });
});

describe('hasLogicalMove', () => {
  it('gibt true zurück wenn ein logischer Zug existiert', () => {
    const board = createEmptyBoard(3, 3);
    board[0][0] = createCell({ isRevealed: true, adjacentMines: 1 });
    board[0][1] = createCell({ isRevealed: true, adjacentMines: 0 });
    board[1][0] = createCell({ isRevealed: true, adjacentMines: 0 });
    board[1][1] = createCell({ isMine: true });

    expect(hasLogicalMove(board)).toBe(true);
  });

  it('gibt false zurück bei leerem Board', () => {
    const board = createEmptyBoard(3, 3);
    expect(hasLogicalMove(board)).toBe(false);
  });
});

describe('findAllSafeMoves', () => {
  it('findet alle sicheren Zellen', () => {
    const board = createEmptyBoard(3, 3);
    board[0][0] = createCell({ isMine: true, isFlagged: true });
    board[0][1] = createCell({ isRevealed: true, adjacentMines: 1 });
    // Alle anderen nicht-geflaggten Nachbarn von (0,1) sind sicher

    const safeMoves = findAllSafeMoves(board);
    expect(safeMoves.length).toBeGreaterThan(0);
  });

  it('gibt leeres Array zurück wenn keine sicheren Züge existieren', () => {
    const board = createEmptyBoard(3, 3);
    const safeMoves = findAllSafeMoves(board);
    expect(safeMoves).toEqual([]);
  });
});

describe('findAllMines', () => {
  it('findet alle erkennbaren Minen', () => {
    const board = createEmptyBoard(3, 3);
    board[0][0] = createCell({ isRevealed: true, adjacentMines: 1 });
    board[0][1] = createCell({ isRevealed: true, adjacentMines: 0 });
    board[1][0] = createCell({ isRevealed: true, adjacentMines: 0 });
    board[1][1] = createCell({ isMine: true }); // einziger hidden Nachbar

    const mines = findAllMines(board);
    expect(mines).toContainEqual([1, 1]);
  });

  it('gibt leeres Array zurück bei leerem Board', () => {
    const board = createEmptyBoard(3, 3);
    expect(findAllMines(board)).toEqual([]);
  });
});

describe('analyzeMistake', () => {
  it('erkennt wenn ein sicherer Zug verfügbar war', () => {
    const board = createEmptyBoard(3, 3);
    board[0][0] = createCell({ isMine: true, isFlagged: true });
    board[0][1] = createCell({ isRevealed: true, adjacentMines: 1 });

    const analysis = analyzeMistake(board, 2, 2);
    expect(analysis.explodedCell).toEqual([2, 2]);
    expect(analysis.wasGuessRequired).toBe(false);
    expect(analysis.lastSafeMove).not.toBeNull();
  });

  it('erkennt wenn ein Guess nötig war', () => {
    const board = createEmptyBoard(3, 3);
    // Komplett hidden board -> kein logischer Zug
    const analysis = analyzeMistake(board, 1, 1);
    expect(analysis.wasGuessRequired).toBe(true);
    expect(analysis.lastSafeMove).toBeNull();
    expect(analysis.explanation).toContain('Guess');
  });
});
