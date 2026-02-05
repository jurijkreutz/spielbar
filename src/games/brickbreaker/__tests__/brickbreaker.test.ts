/**
 * Brick Breaker Logic Tests
 *
 * Diese Tests prüfen:
 * - deterministische Level-Patterns
 * - Brick-Layout (Bounds/Count)
 * - Anti-Stuck Normalisierung der Ball-Velocity
 * - deterministische Powerup-Drops
 */

import {
  LEVEL_PATTERNS,
  buildBricks,
  countBricksInPattern,
  normalizeVelocity,
  getPowerupDrop,
} from '../lib/brickbreakerLogic';
import type { BrickLayoutConfig } from '../lib/brickbreakerLogic';

const LAYOUT: BrickLayoutConfig = {
  canvasWidth: 720,
  brickPaddingX: 40,
  brickGap: 8,
  brickHeight: 20,
  brickTopOffset: 56,
};

describe('Brick Breaker - Core Logic', () => {
  it('erstellt deterministische Brick-Anzahl pro Level', () => {
    LEVEL_PATTERNS.forEach((pattern, index) => {
      const bricks = buildBricks(index + 1, LAYOUT, LEVEL_PATTERNS);
      const expected = countBricksInPattern(pattern);
      expect(bricks).toHaveLength(expected);
    });
  });

  it('erstellt Bricks innerhalb des Spielfelds', () => {
    const bricks = buildBricks(1, LAYOUT, LEVEL_PATTERNS);
    const cols = LEVEL_PATTERNS[0][0].length;
    const brickWidth = (LAYOUT.canvasWidth - LAYOUT.brickPaddingX * 2 - LAYOUT.brickGap * (cols - 1)) / cols;

    bricks.forEach((brick) => {
      expect(brick.width).toBeCloseTo(brickWidth, 5);
      expect(brick.x).toBeGreaterThanOrEqual(0);
      expect(brick.x + brick.width).toBeLessThanOrEqual(LAYOUT.canvasWidth + 0.01);
      expect(brick.y).toBeGreaterThanOrEqual(LAYOUT.brickTopOffset);
    });
  });

  it('normalisiert Ball-Geschwindigkeit, damit keine flachen Winkel hängen bleiben', () => {
    const speed = 300;
    const { vx, vy } = normalizeVelocity(2, -30, speed, 1);

    expect(Math.hypot(vx, vy)).toBeCloseTo(speed, 4);
    expect(Math.abs(vx)).toBeGreaterThanOrEqual(speed * 0.22 - 0.1);
    expect(Math.abs(vy)).toBeGreaterThanOrEqual(speed * 0.22 - 0.1);
  });

  it('liefert deterministische Powerup-Drops', () => {
    const types = ['multi', 'wide', 'slow'] as const;
    expect(getPowerupDrop(0, 1, 4, types)).toBeNull();
    expect(getPowerupDrop(6, 1, 4, types)).toBe('multi');
  });
});
