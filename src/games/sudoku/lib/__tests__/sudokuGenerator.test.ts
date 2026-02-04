/**
 * Sudoku Generator Tests
 *
 * Diese Tests stellen sicher, dass:
 * 1. Generierte Sudokus gültig sind (keine Regelverstoße)
 * 2. Jedes Puzzle genau eine Lösung hat (eindeutig lösbar)
 * 3. Die Lösung korrekt ist
 * 4. Der Seed deterministisch funktioniert (gleiches Datum = gleiches Puzzle)
 * 5. Verschiedene Schwierigkeitsgrade die richtige Anzahl an Clues haben
 */

import {
  generateSudoku,
  generateDailySudoku,
  createBoardFromData,
  getTodayDateString
} from '../sudokuGenerator';
import type { Difficulty } from '../../types/sudoku';
import { DIFFICULTY_CONFIG } from '../../types/sudoku';

// ============================================================================
// HELPER FUNCTIONS für Tests
// ============================================================================

/**
 * Prüft ob ein Sudoku-Board die Grundregeln erfüllt:
 * - Jede Zahl 1-9 kommt in jeder Zeile max. einmal vor
 * - Jede Zahl 1-9 kommt in jeder Spalte max. einmal vor
 * - Jede Zahl 1-9 kommt in jedem 3x3 Block max. einmal vor
 */
function isValidBoard(board: number[][]): boolean {
  // Zeilen prüfen
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false;
        seen.add(num);
      }
    }
  }

  // Spalten prüfen
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const num = board[row][col];
      if (num !== 0) {
        if (seen.has(num)) return false;
        seen.add(num);
      }
    }
  }

  // 3x3 Blöcke prüfen
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const seen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const num = board[blockRow * 3 + r][blockCol * 3 + c];
          if (num !== 0) {
            if (seen.has(num)) return false;
            seen.add(num);
          }
        }
      }
    }
  }

  return true;
}

/**
 * Prüft ob eine Lösung vollständig und korrekt ist
 */
function isCompleteSolution(board: number[][]): boolean {
  // Muss gültig sein
  if (!isValidBoard(board)) return false;

  // Alle Zellen müssen gefüllt sein
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) return false;
      if (board[row][col] < 1 || board[row][col] > 9) return false;
    }
  }

  // Jede Zeile muss 1-9 enthalten
  for (let row = 0; row < 9; row++) {
    const nums = new Set(board[row]);
    if (nums.size !== 9) return false;
  }

  // Jede Spalte muss 1-9 enthalten
  for (let col = 0; col < 9; col++) {
    const nums = new Set<number>();
    for (let row = 0; row < 9; row++) {
      nums.add(board[row][col]);
    }
    if (nums.size !== 9) return false;
  }

  return true;
}

/**
 * Zählt die Anzahl der vorgegebenen Zahlen (Clues) in einem Puzzle
 */
function countClues(board: number[][]): number {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) count++;
    }
  }
  return count;
}

/**
 * Prüft ob das Puzzle mit der Lösung kompatibel ist
 * (alle Clues im Puzzle stimmen mit der Lösung überein)
 */
function puzzleMatchesSolution(puzzle: number[][], solution: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0 && puzzle[row][col] !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Löst ein Sudoku und gibt die Lösung zurück (oder null wenn unlösbar)
 */
function solveSudoku(puzzle: number[][]): number[][] | null {
  const board = puzzle.map(row => [...row]);

  function isValid(row: number, col: number, num: number): boolean {
    // Zeile
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }
    // Spalte
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }
    // Block
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(row, col, num)) {
              board[row][col] = num;
              if (solve()) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  return solve() ? board : null;
}

/**
 * Zählt die Anzahl der Lösungen eines Puzzles (max 2 für Performance)
 */
function countSolutions(puzzle: number[][]): number {
  const board = puzzle.map(row => [...row]);
  let count = 0;

  function isValid(row: number, col: number, num: number): boolean {
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  function solve(): void {
    if (count >= 2) return; // Früher Abbruch

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(row, col, num)) {
              board[row][col] = num;
              solve();
              if (count >= 2) {
                board[row][col] = 0;
                return;
              }
              board[row][col] = 0;
            }
          }
          return;
        }
      }
    }
    count++;
  }

  solve();
  return count;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Sudoku Generator', () => {

  describe('Basis-Validierung', () => {

    test('generiert ein gültiges Easy-Puzzle', () => {
      const { puzzle, solution } = generateSudoku('easy');

      // Puzzle zu number[][] konvertieren
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      expect(isValidBoard(puzzleNumbers)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });

    test('generiert ein gültiges Medium-Puzzle', () => {
      const { puzzle, solution } = generateSudoku('medium');

      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      expect(isValidBoard(puzzleNumbers)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });

    test('generiert ein gültiges Hard-Puzzle', () => {
      const { puzzle, solution } = generateSudoku('hard');

      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      expect(isValidBoard(puzzleNumbers)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });
  });

  describe('Schwierigkeitsgrade', () => {

test('Easy hat ca. 38 Clues (Zielwert aus Config)', () => {
      const { puzzle } = generateSudoku('easy');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));
      const clues = countClues(puzzleNumbers);

      // Der Generator versucht 38 Clues zu erreichen, kann aber weniger sein
      // wenn mehr Zellen entfernt werden müssen für Eindeutigkeit
      expect(clues).toBeGreaterThanOrEqual(35);
      expect(clues).toBeLessThanOrEqual(45);
    });

test('Medium hat ca. 30 Clues (Zielwert aus Config)', () => {
      const { puzzle } = generateSudoku('medium');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));
      const clues = countClues(puzzleNumbers);

      expect(clues).toBeGreaterThanOrEqual(27);
      expect(clues).toBeLessThanOrEqual(35);
    });

test('Hard hat ca. 24 Clues (Zielwert aus Config)', () => {
      const { puzzle } = generateSudoku('hard');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));
      const clues = countClues(puzzleNumbers);

      expect(clues).toBeGreaterThanOrEqual(22);
      expect(clues).toBeLessThanOrEqual(28);
    });

    test('Schwierigkeit korreliert mit Clue-Anzahl', () => {
      const easy = generateSudoku('easy');
      const medium = generateSudoku('medium');
      const hard = generateSudoku('hard');

      const easyClues = countClues(easy.puzzle.map(row => row.map(cell => cell.value)));
      const mediumClues = countClues(medium.puzzle.map(row => row.map(cell => cell.value)));
      const hardClues = countClues(hard.puzzle.map(row => row.map(cell => cell.value)));

      expect(easyClues).toBeGreaterThan(mediumClues);
      expect(mediumClues).toBeGreaterThan(hardClues);
    });
  });

  describe('Eindeutigkeit der Lösung', () => {

    test('Easy-Puzzle hat genau eine Lösung', () => {
      const { puzzle } = generateSudoku('easy');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      const solutions = countSolutions(puzzleNumbers);
      expect(solutions).toBe(1);
    });

    test('Medium-Puzzle hat genau eine Lösung', () => {
      const { puzzle } = generateSudoku('medium');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      const solutions = countSolutions(puzzleNumbers);
      expect(solutions).toBe(1);
    });

    test('Hard-Puzzle hat genau eine Lösung', () => {
      const { puzzle } = generateSudoku('hard');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      const solutions = countSolutions(puzzleNumbers);
      expect(solutions).toBe(1);
    });
  });

  describe('Puzzle-Lösung Konsistenz', () => {

    test('Puzzle-Clues stimmen mit Lösung überein', () => {
      const { puzzle, solution } = generateSudoku('medium');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      expect(puzzleMatchesSolution(puzzleNumbers, solution)).toBe(true);
    });

    test('Gelöstes Puzzle entspricht der mitgelieferten Lösung', () => {
      const { puzzle, solution } = generateSudoku('medium');
      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

      const solved = solveSudoku(puzzleNumbers);
      expect(solved).not.toBeNull();

      // Vergleiche jede Zelle
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          expect(solved![row][col]).toBe(solution[row][col]);
        }
      }
    });
  });

  describe('Seed-Determinismus', () => {

    test('Gleicher Seed erzeugt identisches Puzzle', () => {
      const seed = 'test-seed-12345';

      const result1 = generateSudoku('medium', seed);
      const result2 = generateSudoku('medium', seed);

      const puzzle1 = result1.puzzle.map(row => row.map(cell => cell.value));
      const puzzle2 = result2.puzzle.map(row => row.map(cell => cell.value));

      expect(puzzle1).toEqual(puzzle2);
      expect(result1.solution).toEqual(result2.solution);
    });

    test('Unterschiedliche Seeds erzeugen unterschiedliche Puzzles', () => {
      const result1 = generateSudoku('medium', 'seed-a');
      const result2 = generateSudoku('medium', 'seed-b');

      const puzzle1 = result1.puzzle.map(row => row.map(cell => cell.value));
      const puzzle2 = result2.puzzle.map(row => row.map(cell => cell.value));

      // Mindestens eine Zelle sollte unterschiedlich sein
      let hassDifference = false;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle1[row][col] !== puzzle2[row][col]) {
            hassDifference = true;
            break;
          }
        }
        if (hassDifference) break;
      }

      expect(hassDifference).toBe(true);
    });
  });

  describe('Daily Sudoku', () => {

    test('Daily Puzzle ist gültig', () => {
      const { puzzle, solution } = generateDailySudoku('2026-02-04');

      expect(isValidBoard(puzzle)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });

    test('Daily Puzzle hat genau eine Lösung', () => {
      const { puzzle } = generateDailySudoku('2026-02-04');

      const solutions = countSolutions(puzzle);
      expect(solutions).toBe(1);
    });

    test('Gleiches Datum erzeugt identisches Daily Puzzle', () => {
      const result1 = generateDailySudoku('2026-02-04');
      const result2 = generateDailySudoku('2026-02-04');

      expect(result1.puzzle).toEqual(result2.puzzle);
      expect(result1.solution).toEqual(result2.solution);
      expect(result1.seed).toEqual(result2.seed);
    });

    test('Unterschiedliche Daten erzeugen unterschiedliche Puzzles', () => {
      const result1 = generateDailySudoku('2026-02-04');
      const result2 = generateDailySudoku('2026-02-05');

      let hasDifference = false;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (result1.puzzle[row][col] !== result2.puzzle[row][col]) {
            hasDifference = true;
            break;
          }
        }
        if (hasDifference) break;
      }

      expect(hasDifference).toBe(true);
    });

test('Daily ist immer Medium Schwierigkeit', () => {
      const { difficulty, puzzle } = generateDailySudoku('2026-02-04');

      expect(difficulty).toBe('medium');

      const clues = countClues(puzzle);
      expect(clues).toBeGreaterThanOrEqual(27);
      expect(clues).toBeLessThanOrEqual(35);
    });

    test('getTodayDateString gibt korrektes Format zurück', () => {
      const dateString = getTodayDateString();

      // Format: YYYY-MM-DD
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('createBoardFromData', () => {

    test('konvertiert number[][] korrekt zu SudokuBoard', () => {
      const data = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ];

      const board = createBoardFromData(data);

      // Größe prüfen
      expect(board.length).toBe(9);
      expect(board[0].length).toBe(9);

      // Given-Flags prüfen
      expect(board[0][0].isGiven).toBe(true); // 5
      expect(board[0][2].isGiven).toBe(false); // 0

      // Werte prüfen
      expect(board[0][0].value).toBe(5);
      expect(board[0][2].value).toBe(0);

      // Notizen sind leer
      expect(board[0][0].notes.size).toBe(0);

      // Keine Fehler
      expect(board[0][0].isError).toBe(false);
    });
  });

  describe('Stress-Tests (mehrere Puzzles)', () => {

    test('10 Easy-Puzzles sind alle gültig und eindeutig lösbar', () => {
      for (let i = 0; i < 10; i++) {
        const { puzzle, solution } = generateSudoku('easy', `stress-easy-${i}`);
        const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

        expect(isValidBoard(puzzleNumbers)).toBe(true);
        expect(isCompleteSolution(solution)).toBe(true);
        expect(countSolutions(puzzleNumbers)).toBe(1);
        expect(puzzleMatchesSolution(puzzleNumbers, solution)).toBe(true);
      }
    });

    test('10 Medium-Puzzles sind alle gültig und eindeutig lösbar', () => {
      for (let i = 0; i < 10; i++) {
        const { puzzle, solution } = generateSudoku('medium', `stress-medium-${i}`);
        const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

        expect(isValidBoard(puzzleNumbers)).toBe(true);
        expect(isCompleteSolution(solution)).toBe(true);
        expect(countSolutions(puzzleNumbers)).toBe(1);
        expect(puzzleMatchesSolution(puzzleNumbers, solution)).toBe(true);
      }
    });

    test('10 Hard-Puzzles sind alle gültig und eindeutig lösbar', () => {
      for (let i = 0; i < 10; i++) {
        const { puzzle, solution } = generateSudoku('hard', `stress-hard-${i}`);
        const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));

        expect(isValidBoard(puzzleNumbers)).toBe(true);
        expect(isCompleteSolution(solution)).toBe(true);
        expect(countSolutions(puzzleNumbers)).toBe(1);
        expect(puzzleMatchesSolution(puzzleNumbers, solution)).toBe(true);
      }
    });

    test('30 Daily-Puzzles (ein Monat) sind alle gültig', () => {
      for (let day = 1; day <= 30; day++) {
        const date = `2026-02-${String(day).padStart(2, '0')}`;
        const { puzzle, solution } = generateDailySudoku(date);

        expect(isValidBoard(puzzle)).toBe(true);
        expect(isCompleteSolution(solution)).toBe(true);
        expect(countSolutions(puzzle)).toBe(1);
        expect(puzzleMatchesSolution(puzzle, solution)).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {

    test('leerer Seed wird akzeptiert', () => {
      const { puzzle, solution, seed } = generateSudoku('easy');

      expect(seed).toBeTruthy();
      expect(puzzle.length).toBe(9);
      expect(isCompleteSolution(solution)).toBe(true);
    });

    test('sehr langer Seed funktioniert', () => {
      const longSeed = 'a'.repeat(1000);
      const { puzzle, solution } = generateSudoku('medium', longSeed);

      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));
      expect(isValidBoard(puzzleNumbers)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });

    test('Sonderzeichen im Seed funktionieren', () => {
      const specialSeed = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const { puzzle, solution } = generateSudoku('medium', specialSeed);

      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));
      expect(isValidBoard(puzzleNumbers)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });

    test('Unicode im Seed funktioniert', () => {
      const unicodeSeed = '日本語テスト🎮🧩';
      const { puzzle, solution } = generateSudoku('medium', unicodeSeed);

      const puzzleNumbers = puzzle.map(row => row.map(cell => cell.value));
      expect(isValidBoard(puzzleNumbers)).toBe(true);
      expect(isCompleteSolution(solution)).toBe(true);
    });
  });
});

