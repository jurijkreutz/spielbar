/**
 * Tests für Game Descriptions
 *
 * Prüft:
 * - getGameDescription: korrekte Beschreibungen für bekannte Slugs
 * - null für unbekannte Slugs
 * - Alle Beschreibungen haben short und long
 * - Short-Beschreibungen sind innerhalb Zeichenlimits
 */

import { getGameDescription, GAME_DESCRIPTIONS } from '../gameDescriptions';

describe('getGameDescription', () => {
  it('gibt korrekte Beschreibung für bekannte Slugs zurück', () => {
    const minesweeper = getGameDescription('minesweeper');
    expect(minesweeper).not.toBeNull();
    expect(minesweeper!.short).toBeTruthy();
    expect(minesweeper!.long).toBeTruthy();
  });

  it('gibt null für unbekannte Slugs zurück', () => {
    expect(getGameDescription('tetris')).toBeNull();
    expect(getGameDescription('chess')).toBeNull();
    expect(getGameDescription('')).toBeNull();
  });

  it('gibt Beschreibung für alle definierten Spiele zurück', () => {
    const expectedSlugs = [
      'minesweeper',
      'minesweeper-daily',
      'sudoku',
      'sudoku-daily',
      'stacktower',
      'stack-tower',
      'lemonadestand',
      'brick-breaker',
      'snake',
    ];

    for (const slug of expectedSlugs) {
      const desc = getGameDescription(slug);
      expect(desc).not.toBeNull();
    }
  });
});

describe('GAME_DESCRIPTIONS', () => {
  it('alle Einträge haben short und long', () => {
    for (const [slug, desc] of Object.entries(GAME_DESCRIPTIONS)) {
      expect(desc).toHaveProperty('short');
      expect(desc).toHaveProperty('long');
      expect(desc.short.length).toBeGreaterThan(0);
      expect(desc.long.length).toBeGreaterThan(0);
    }
  });

  it('short ist kürzer als long', () => {
    for (const [slug, desc] of Object.entries(GAME_DESCRIPTIONS)) {
      expect(desc.short.length).toBeLessThanOrEqual(desc.long.length);
    }
  });

  it('short-Beschreibungen sind unter 120 Zeichen', () => {
    for (const [slug, desc] of Object.entries(GAME_DESCRIPTIONS)) {
      expect(desc.short.length).toBeLessThanOrEqual(120);
    }
  });

  it('stacktower und stack-tower haben identische Beschreibungen', () => {
    expect(GAME_DESCRIPTIONS['stacktower']).toEqual(GAME_DESCRIPTIONS['stack-tower']);
  });
});
