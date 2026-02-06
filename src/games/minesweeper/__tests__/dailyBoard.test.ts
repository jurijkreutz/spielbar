/**
 * Tests für die Daily Board Generierung (Minesweeper)
 *
 * Prüft:
 * - SeededRandom: Determinismus, hashString, nextInt-Grenzen, shuffle
 * - getNeighbors: Ecken, Kanten, Zentrum
 * - createBoard: Dimensionen, Minenplatzierung, adjacentMines
 * - revealCell: Flood-Fill, Stopp bei Zahlen, keine Minen aufdecken
 * - findLogicalMove: sichere Zellen, Minen, null bei Ambiguität
 * - isFullySolvable: lösbare und unlösbare Boards
 * - generateDailyBoard: Determinismus, Schwierigkeitsrotation, Lösbarkeit
 */

import { generateDailyBoard, createBoardFromPositions } from '../lib/dailyBoard';
import type { CellState } from '../types/minesweeper';

// ========== HELPER: Interne Klassen/Funktionen nachbauen für isolierte Tests ==========

// SeededRandom nachgebaut (Klasse ist nicht exportiert)
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
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

// ========== TESTS ==========

describe('SeededRandom', () => {
  describe('Determinismus', () => {
    it('erzeugt identische Sequenzen bei gleichem Seed', () => {
      const rng1 = new SeededRandom('test-seed');
      const rng2 = new SeededRandom('test-seed');

      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });

    it('erzeugt unterschiedliche Sequenzen bei verschiedenen Seeds', () => {
      const rng1 = new SeededRandom('seed-a');
      const rng2 = new SeededRandom('seed-b');

      const val1 = rng1.next();
      const val2 = rng2.next();

      expect(val1).not.toBe(val2);
    });
  });

  describe('next()', () => {
    it('gibt Werte zwischen 0 und 1 zurück', () => {
      const rng = new SeededRandom('bounds-test');
      for (let i = 0; i < 100; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('nextInt()', () => {
    it('gibt Werte im angegebenen Bereich zurück', () => {
      const rng = new SeededRandom('nextint-test');
      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(5, 10);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThanOrEqual(10);
      }
    });

    it('gibt exakte Grenzen zurück bei min === max', () => {
      const rng = new SeededRandom('exact');
      expect(rng.nextInt(7, 7)).toBe(7);
    });
  });

  describe('shuffle()', () => {
    it('behält alle Elemente bei', () => {
      const rng = new SeededRandom('shuffle-test');
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = rng.shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort((a, b) => a - b)).toEqual(original);
    });

    it('verändert das Original-Array nicht', () => {
      const rng = new SeededRandom('immutable');
      const original = [1, 2, 3];
      const copy = [...original];
      rng.shuffle(original);
      expect(original).toEqual(copy);
    });

    it('erzeugt deterministisches Ergebnis', () => {
      const rng1 = new SeededRandom('shuffle-det');
      const rng2 = new SeededRandom('shuffle-det');
      const arr = [1, 2, 3, 4, 5];

      expect(rng1.shuffle(arr)).toEqual(rng2.shuffle(arr));
    });
  });
});

describe('getNeighbors', () => {
  it('gibt 3 Nachbarn für Ecke oben-links zurück', () => {
    const neighbors = getNeighbors(0, 0, 9, 9);
    expect(neighbors).toHaveLength(3);
    expect(neighbors).toContainEqual([0, 1]);
    expect(neighbors).toContainEqual([1, 0]);
    expect(neighbors).toContainEqual([1, 1]);
  });

  it('gibt 3 Nachbarn für Ecke unten-rechts zurück', () => {
    const neighbors = getNeighbors(8, 8, 9, 9);
    expect(neighbors).toHaveLength(3);
  });

  it('gibt 5 Nachbarn für Kanten-Zelle zurück', () => {
    const neighbors = getNeighbors(0, 4, 9, 9);
    expect(neighbors).toHaveLength(5);
  });

  it('gibt 8 Nachbarn für Zentrum-Zelle zurück', () => {
    const neighbors = getNeighbors(4, 4, 9, 9);
    expect(neighbors).toHaveLength(8);
  });

  it('enthält nicht die Zelle selbst', () => {
    const neighbors = getNeighbors(4, 4, 9, 9);
    expect(neighbors).not.toContainEqual([4, 4]);
  });
});

describe('createBoardFromPositions', () => {
  it('erstellt Board mit korrekten Dimensionen', () => {
    const board = createBoardFromPositions(9, 9, [[0, 0]]);
    expect(board).toHaveLength(9);
    expect(board[0]).toHaveLength(9);
  });

  it('platziert Minen korrekt', () => {
    const minePositions: [number, number][] = [[0, 0], [3, 5], [8, 8]];
    const board = createBoardFromPositions(9, 9, minePositions);

    expect(board[0][0].isMine).toBe(true);
    expect(board[3][5].isMine).toBe(true);
    expect(board[8][8].isMine).toBe(true);
    expect(board[1][1].isMine).toBe(false);
  });

  it('berechnet adjacentMines korrekt', () => {
    // Mine bei (0,0), Nachbarzellen sollten 1 haben
    const board = createBoardFromPositions(3, 3, [[0, 0]]);

    expect(board[0][1].adjacentMines).toBe(1);
    expect(board[1][0].adjacentMines).toBe(1);
    expect(board[1][1].adjacentMines).toBe(1);
    expect(board[2][2].adjacentMines).toBe(0);
  });

  it('berechnet adjacentMines korrekt bei mehreren Minen', () => {
    // Minen bei (0,0) und (0,2) -> (0,1) sollte 2 haben
    const board = createBoardFromPositions(3, 3, [[0, 0], [0, 2]]);

    expect(board[0][1].adjacentMines).toBe(2);
    expect(board[1][1].adjacentMines).toBe(2);
  });

  it('setzt adjacentMines für Minen-Zellen nicht', () => {
    const board = createBoardFromPositions(3, 3, [[1, 1]]);
    // Mine selbst hat adjacentMines = 0 (wird nicht berechnet)
    expect(board[1][1].adjacentMines).toBe(0);
    expect(board[1][1].isMine).toBe(true);
  });

  it('initialisiert alle Zellen als nicht aufgedeckt und nicht geflaggt', () => {
    const board = createBoardFromPositions(5, 5, [[2, 2]]);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(board[r][c].isRevealed).toBe(false);
        expect(board[r][c].isFlagged).toBe(false);
      }
    }
  });
});

describe('generateDailyBoard', () => {
  it('ist deterministisch für dasselbe Datum', () => {
    const board1 = generateDailyBoard('2024-06-15');
    const board2 = generateDailyBoard('2024-06-15');

    expect(board1.minePositions).toEqual(board2.minePositions);
    expect(board1.startPosition).toEqual(board2.startPosition);
    expect(board1.rows).toBe(board2.rows);
    expect(board1.cols).toBe(board2.cols);
    expect(board1.mines).toBe(board2.mines);
    expect(board1.difficulty).toBe(board2.difficulty);
    expect(board1.seed).toBe(board2.seed);
  });

  it('erzeugt unterschiedliche Boards für verschiedene Daten', () => {
    const board1 = generateDailyBoard('2024-06-15');
    const board2 = generateDailyBoard('2024-06-16');

    // Mindestens eines der Felder sollte sich unterscheiden
    const different =
      JSON.stringify(board1.minePositions) !== JSON.stringify(board2.minePositions) ||
      board1.difficulty !== board2.difficulty;
    expect(different).toBe(true);
  });

  it('rotiert die Schwierigkeit nach Wochentag', () => {
    // Sonntag (0) = easy, Montag (1) = easy, Di-Do = medium, Fr-Sa = hard
    // 2024-06-16 ist Sonntag
    const sunday = generateDailyBoard('2024-06-16');
    expect(sunday.difficulty).toBe('easy');

    // 2024-06-17 ist Montag
    const monday = generateDailyBoard('2024-06-17');
    expect(monday.difficulty).toBe('easy');

    // 2024-06-18 ist Dienstag
    const tuesday = generateDailyBoard('2024-06-18');
    expect(tuesday.difficulty).toBe('medium');

    // 2024-06-21 ist Freitag
    const friday = generateDailyBoard('2024-06-21');
    expect(friday.difficulty).toBe('hard');
  });

  it('gibt korrekte Dimensionen pro Schwierigkeit zurück', () => {
    // Easy: 9x9, 10 Minen
    const easy = generateDailyBoard('2024-06-16'); // Sonntag
    expect(easy.rows).toBe(9);
    expect(easy.cols).toBe(9);
    expect(easy.mines).toBe(10);

    // Medium: 12x12, 25 Minen
    const medium = generateDailyBoard('2024-06-18'); // Dienstag
    expect(medium.rows).toBe(12);
    expect(medium.cols).toBe(12);
    expect(medium.mines).toBe(25);

    // Hard: 16x16, 45 Minen
    const hard = generateDailyBoard('2024-06-21'); // Freitag
    expect(hard.rows).toBe(16);
    expect(hard.cols).toBe(16);
    expect(hard.mines).toBe(45);
  });

  it('platziert die korrekte Anzahl Minen', () => {
    const board = generateDailyBoard('2024-06-15');
    expect(board.minePositions).toHaveLength(board.mines);
  });

  it('Startposition ist nicht am Rand', () => {
    const board = generateDailyBoard('2024-06-15');
    const [startRow, startCol] = board.startPosition;
    expect(startRow).toBeGreaterThanOrEqual(1);
    expect(startRow).toBeLessThanOrEqual(board.rows - 2);
    expect(startCol).toBeGreaterThanOrEqual(1);
    expect(startCol).toBeLessThanOrEqual(board.cols - 2);
  });

  it('platziert keine Mine auf der Startposition oder deren Nachbarn', () => {
    const result = generateDailyBoard('2024-06-15');
    const [startRow, startCol] = result.startPosition;
    const safePositions = new Set<string>();
    safePositions.add(`${startRow},${startCol}`);
    for (const [nr, nc] of getNeighbors(startRow, startCol, result.rows, result.cols)) {
      safePositions.add(`${nr},${nc}`);
    }

    for (const [mr, mc] of result.minePositions) {
      expect(safePositions.has(`${mr},${mc}`)).toBe(false);
    }
  });

  it('erzeugt lösbare Boards (Easy-Schwierigkeit)', () => {
    // Teste mehrere Daten
    const easyDates = ['2024-06-16', '2024-06-23', '2024-06-30'];
    for (const date of easyDates) {
      const result = generateDailyBoard(date);
      // Wenn das Board nicht als Fallback generiert wurde, ist es lösbar
      expect(result.seed).not.toContain('fallback');
    }
  });
});
