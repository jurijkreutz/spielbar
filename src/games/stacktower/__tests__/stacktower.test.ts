/**
 * Tests für Stack Tower Game Logic
 *
 * Prüft:
 * - Block-Overlap-Berechnung (partial, perfect, miss)
 * - Perfect-Placement-Erkennung und Streak-Tracking
 * - Falling Fragment Generierung
 * - Geschwindigkeitssteigerung pro Block
 * - Farbpaletten-Zykluslänge
 * - Score-Berechnung
 * - Game Over bei keinem Overlap
 */

import { GAME_CONFIG, BLOCK_COLORS } from '../types/stacktower';
import type { Block, FallingPiece } from '../types/stacktower';

// ========== Hilfsfunktionen (aus useStackTower extrahiert) ==========

function getBlockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

function calculateOverlap(
  current: { x: number; width: number },
  last: { x: number; width: number }
): { overlapLeft: number; overlapRight: number; overlapWidth: number } {
  const currentLeft = current.x;
  const currentRight = current.x + current.width;
  const lastLeft = last.x;
  const lastRight = last.x + last.width;

  const overlapLeft = Math.max(currentLeft, lastLeft);
  const overlapRight = Math.min(currentRight, lastRight);
  const overlapWidth = overlapRight - overlapLeft;

  return { overlapLeft, overlapRight, overlapWidth };
}

function isPerfectPlacement(currentX: number, lastX: number): boolean {
  return Math.abs(currentX - lastX) <= GAME_CONFIG.PERFECT_THRESHOLD;
}

function calculateScore(currentScore: number, isPerfect: boolean, perfectStreak: number): number {
  return currentScore + 1 + (isPerfect ? perfectStreak : 0);
}

function calculateSpeed(blocksCount: number): number {
  return Math.min(
    GAME_CONFIG.INITIAL_SPEED + blocksCount * GAME_CONFIG.SPEED_INCREMENT,
    GAME_CONFIG.MAX_SPEED
  );
}

// ========== TESTS ==========

describe('GAME_CONFIG', () => {
  it('hat gültige Canvas-Dimensionen', () => {
    expect(GAME_CONFIG.CANVAS_WIDTH).toBeGreaterThan(0);
    expect(GAME_CONFIG.CANVAS_HEIGHT).toBeGreaterThan(0);
  });

  it('Perfect Threshold ist positiv', () => {
    expect(GAME_CONFIG.PERFECT_THRESHOLD).toBeGreaterThan(0);
  });

  it('Max Speed ist größer als Initial Speed', () => {
    expect(GAME_CONFIG.MAX_SPEED).toBeGreaterThan(GAME_CONFIG.INITIAL_SPEED);
  });
});

describe('Block Overlap Berechnung', () => {
  it('berechnet vollständigen Overlap korrekt', () => {
    const current = { x: 100, width: 200 };
    const last = { x: 100, width: 200 };
    const { overlapWidth } = calculateOverlap(current, last);
    expect(overlapWidth).toBe(200);
  });

  it('berechnet partiellen Overlap korrekt (Block zu weit rechts)', () => {
    const current = { x: 150, width: 200 };
    const last = { x: 100, width: 200 };
    const { overlapWidth } = calculateOverlap(current, last);
    expect(overlapWidth).toBe(150);
  });

  it('berechnet partiellen Overlap korrekt (Block zu weit links)', () => {
    const current = { x: 50, width: 200 };
    const last = { x: 100, width: 200 };
    const { overlapWidth } = calculateOverlap(current, last);
    expect(overlapWidth).toBe(150);
  });

  it('erkennt keinen Overlap (komplett daneben rechts)', () => {
    const current = { x: 350, width: 200 };
    const last = { x: 100, width: 200 };
    const { overlapWidth } = calculateOverlap(current, last);
    expect(overlapWidth).toBeLessThanOrEqual(0);
  });

  it('erkennt keinen Overlap (komplett daneben links)', () => {
    const current = { x: 0, width: 50 };
    const last = { x: 200, width: 200 };
    const { overlapWidth } = calculateOverlap(current, last);
    expect(overlapWidth).toBeLessThanOrEqual(0);
  });
});

describe('Perfect Placement', () => {
  it('erkennt exakte Platzierung als Perfect', () => {
    expect(isPerfectPlacement(100, 100)).toBe(true);
  });

  it('erkennt Platzierung innerhalb des Thresholds als Perfect', () => {
    expect(isPerfectPlacement(103, 100)).toBe(true);
    expect(isPerfectPlacement(97, 100)).toBe(true);
  });

  it('erkennt Platzierung am Rand des Thresholds als Perfect', () => {
    expect(isPerfectPlacement(100 + GAME_CONFIG.PERFECT_THRESHOLD, 100)).toBe(true);
  });

  it('erkennt Platzierung außerhalb des Thresholds nicht als Perfect', () => {
    expect(isPerfectPlacement(100 + GAME_CONFIG.PERFECT_THRESHOLD + 1, 100)).toBe(false);
  });
});

describe('Falling Fragment Generierung', () => {
  it('erstellt Falling Fragment wenn Block links übersteht', () => {
    const current = { x: 50, width: 200 };
    const last = { x: 100, width: 200 };

    const pieces: FallingPiece[] = [];
    if (current.x < last.x) {
      pieces.push({
        x: current.x,
        width: last.x - current.x,
        y: 0,
        velocityY: 0,
        color: '#ff0000',
        side: 'left',
      });
    }

    expect(pieces).toHaveLength(1);
    expect(pieces[0].side).toBe('left');
    expect(pieces[0].width).toBe(50);
  });

  it('erstellt Falling Fragment wenn Block rechts übersteht', () => {
    const current = { x: 150, width: 200 };
    const last = { x: 100, width: 200 };

    const pieces: FallingPiece[] = [];
    const currentRight = current.x + current.width;
    const lastRight = last.x + last.width;
    if (currentRight > lastRight) {
      pieces.push({
        x: lastRight,
        width: currentRight - lastRight,
        y: 0,
        velocityY: 0,
        color: '#ff0000',
        side: 'right',
      });
    }

    expect(pieces).toHaveLength(1);
    expect(pieces[0].side).toBe('right');
    expect(pieces[0].width).toBe(50);
  });

  it('erstellt kein Fragment bei Perfect Placement', () => {
    const current = { x: 100, width: 200 };
    const last = { x: 100, width: 200 };

    const pieces: FallingPiece[] = [];
    if (current.x < last.x) {
      pieces.push({ x: 0, width: 0, y: 0, velocityY: 0, color: '', side: 'left' });
    }
    const currentRight = current.x + current.width;
    const lastRight = last.x + last.width;
    if (currentRight > lastRight) {
      pieces.push({ x: 0, width: 0, y: 0, velocityY: 0, color: '', side: 'right' });
    }

    expect(pieces).toHaveLength(0);
  });
});

describe('Geschwindigkeitssteigerung', () => {
  it('steigt mit jedem Block', () => {
    const speed0 = calculateSpeed(0);
    const speed10 = calculateSpeed(10);
    expect(speed10).toBeGreaterThan(speed0);
  });

  it('wird durch MAX_SPEED begrenzt', () => {
    const speedMax = calculateSpeed(1000);
    expect(speedMax).toBe(GAME_CONFIG.MAX_SPEED);
  });

  it('startet bei INITIAL_SPEED', () => {
    expect(calculateSpeed(0)).toBe(GAME_CONFIG.INITIAL_SPEED);
  });
});

describe('Farbpaletten-Zyklus', () => {
  it('cyclet nach BLOCK_COLORS.length', () => {
    const color0 = getBlockColor(0);
    const colorCycle = getBlockColor(BLOCK_COLORS.length);
    expect(colorCycle).toBe(color0);
  });

  it('gibt gültige Farben zurück', () => {
    for (let i = 0; i < 20; i++) {
      const color = getBlockColor(i);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('Score-Berechnung', () => {
  it('gibt 1 Punkt für normalen Block', () => {
    expect(calculateScore(0, false, 0)).toBe(1);
  });

  it('gibt 1 Punkt für ersten Perfect (Streak 0)', () => {
    expect(calculateScore(0, true, 0)).toBe(1);
  });

  it('gibt Bonus für Perfect Streak', () => {
    expect(calculateScore(0, true, 3)).toBe(4); // 1 + 3
    expect(calculateScore(5, true, 5)).toBe(11); // 5 + 1 + 5
  });

  it('setzt Streak bei Non-Perfect zurück (kein Bonus)', () => {
    expect(calculateScore(10, false, 5)).toBe(11); // 10 + 1 + 0
  });
});

describe('Game Over', () => {
  it('tritt ein bei overlapWidth <= 0', () => {
    const current = { x: 400, width: 100 };
    const last = { x: 100, width: 100 };
    const { overlapWidth } = calculateOverlap(current, last);
    expect(overlapWidth <= 0).toBe(true);
  });
});
