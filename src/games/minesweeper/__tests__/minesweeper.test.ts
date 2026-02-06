/**
 * Tests für Minesweeper Types & Configs
 *
 * Prüft:
 * - DIFFICULTY_CONFIGS korrekte Werte pro Schwierigkeit
 * - CellState Typ-Integrität
 */

import { DIFFICULTY_CONFIGS } from '../types/minesweeper';
import type { CellState, Difficulty, GameConfig } from '../types/minesweeper';

describe('DIFFICULTY_CONFIGS', () => {
  it('enthält alle drei Standard-Schwierigkeiten', () => {
    expect(DIFFICULTY_CONFIGS).toHaveProperty('beginner');
    expect(DIFFICULTY_CONFIGS).toHaveProperty('intermediate');
    expect(DIFFICULTY_CONFIGS).toHaveProperty('expert');
  });

  it('Beginner hat korrekte Konfiguration (9x9, 10 Minen)', () => {
    expect(DIFFICULTY_CONFIGS.beginner).toEqual({
      rows: 9,
      cols: 9,
      mines: 10,
    });
  });

  it('Intermediate hat korrekte Konfiguration (16x16, 40 Minen)', () => {
    expect(DIFFICULTY_CONFIGS.intermediate).toEqual({
      rows: 16,
      cols: 16,
      mines: 40,
    });
  });

  it('Expert hat korrekte Konfiguration (16x30, 99 Minen)', () => {
    expect(DIFFICULTY_CONFIGS.expert).toEqual({
      rows: 16,
      cols: 30,
      mines: 99,
    });
  });

  it('Minen-Anzahl ist kleiner als Gesamtzellen pro Schwierigkeit', () => {
    for (const [key, config] of Object.entries(DIFFICULTY_CONFIGS)) {
      const totalCells = config.rows * config.cols;
      expect(config.mines).toBeLessThan(totalCells);
    }
  });

  it('alle Configs haben positive Werte', () => {
    for (const config of Object.values(DIFFICULTY_CONFIGS)) {
      expect(config.rows).toBeGreaterThan(0);
      expect(config.cols).toBeGreaterThan(0);
      expect(config.mines).toBeGreaterThan(0);
    }
  });
});
