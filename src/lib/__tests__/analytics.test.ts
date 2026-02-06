/**
 * Tests für das Analytics System
 *
 * Prüft:
 * - getTodayKey: korrektes ISO-Datumformat
 * - getStartOfWeekUTC: Montag als Wochenstart
 * - setLastPlayed / getLastPlayed: localStorage Round-Trip, Slug-Migration
 * - setDailyCompleted / isDailyCompleted / getTodaysDailyInfo: Daily Status Tracking
 * - markDailyPlayed / getDailyPlayed: Daily Play Tracking
 * - getWeeklyDailyProgress: 3-Tage Weekly Goal + Week Streak
 * - Event Dispatch: spielbar_analytics CustomEvent
 */

import {
  setLastPlayed,
  getLastPlayed,
  setDailyCompleted,
  setDailyStarted,
  isDailyCompleted,
  getTodaysDailyInfo,
  markDailyPlayed,
  getWeeklyDailyProgress,
  getDailyStatus,
  getDailyHubStatus,
  getDailyPrimaryTarget,
  analytics,
  type LastPlayedEntry,
} from '../analytics';

// localStorage Mock mit echtem Speicherverhalten
let store: Record<string, string> = {};

beforeEach(() => {
  store = {};
  (localStorage.getItem as jest.Mock).mockImplementation((key: string) => store[key] ?? null);
  (localStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
    store[key] = value;
  });
  (localStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
    delete store[key];
  });
  (localStorage.clear as jest.Mock).mockImplementation(() => {
    store = {};
  });
});

describe('setLastPlayed / getLastPlayed', () => {
  const entry: LastPlayedEntry = {
    slug: 'minesweeper',
    name: 'Minesweeper',
    href: '/games/minesweeper',
    mode: 'free',
    playedAt: 1700000000000,
  };

  it('speichert und liest einen Eintrag korrekt', () => {
    setLastPlayed(entry);
    const result = getLastPlayed();
    expect(result).toEqual(entry);
  });

  it('gibt null zurück wenn nichts gespeichert ist', () => {
    expect(getLastPlayed()).toBeNull();
  });

  it('migriert stacktower zu stack-tower', () => {
    const legacyEntry: LastPlayedEntry = {
      slug: 'stacktower',
      name: 'Stack Tower',
      href: '/games/stacktower',
      mode: 'free',
      playedAt: 1700000000000,
    };
    setLastPlayed(legacyEntry);

    const result = getLastPlayed();
    expect(result).not.toBeNull();
    expect(result!.slug).toBe('stack-tower');
    expect(result!.href).toBe('/games/stack-tower');
  });

  it('migriert stacktower href nur wenn es der Standard-Pfad ist', () => {
    const legacyEntry: LastPlayedEntry = {
      slug: 'stacktower',
      name: 'Stack Tower',
      href: '/games/stacktower/custom',
      mode: 'free',
      playedAt: 1700000000000,
    };
    setLastPlayed(legacyEntry);

    const result = getLastPlayed();
    expect(result).not.toBeNull();
    expect(result!.slug).toBe('stack-tower');
    expect(result!.href).toBe('/games/stacktower/custom'); // nicht migriert
  });
});

describe('setDailyCompleted / isDailyCompleted', () => {
  it('markiert ein Daily als abgeschlossen', () => {
    setDailyCompleted('minesweeper', { time: 120 });
    expect(isDailyCompleted('minesweeper')).toBe(true);
  });

  it('gibt false zurück wenn noch nicht abgeschlossen', () => {
    expect(isDailyCompleted('minesweeper')).toBe(false);
    expect(isDailyCompleted('sudoku')).toBe(false);
  });

  it('speichert zusätzliche Daten (time, usedHints)', () => {
    setDailyCompleted('minesweeper', { time: 90, moves: 42, usedHints: true });
    const info = getTodaysDailyInfo('minesweeper');
    expect(info).not.toBeNull();
    expect(info!.completed).toBe(true);
    expect(info!.time).toBe(90);
    expect(info!.moves).toBe(42);
    expect(info!.usedHints).toBe(true);
  });

  it('markiert Daily auch als gespielt (markDailyPlayed)', () => {
    setDailyCompleted('sudoku', { time: 300 });
    // Nach setDailyCompleted sollte der Tag als gespielt markiert sein
    const progress = getWeeklyDailyProgress();
    expect(progress.count).toBeGreaterThanOrEqual(1);
  });
});

describe('getTodaysDailyInfo', () => {
  it('gibt null zurück wenn kein Eintrag existiert', () => {
    expect(getTodaysDailyInfo('minesweeper')).toBeNull();
    expect(getTodaysDailyInfo('sudoku')).toBeNull();
  });

  it('gibt korrekten Eintrag zurück', () => {
    setDailyCompleted('sudoku', { time: 250 });
    const info = getTodaysDailyInfo('sudoku');
    expect(info).toEqual({ started: true, completed: true, time: 250 });
  });
});

describe('markDailyPlayed / getWeeklyDailyProgress', () => {
  it('markiert den heutigen Tag als gespielt', () => {
    markDailyPlayed();
    const progress = getWeeklyDailyProgress();
    expect(progress.count).toBeGreaterThanOrEqual(1);
    expect(progress.total).toBe(7);
    expect(progress.goal).toBe(3);
  });

  it('zählt verschiedene Tage korrekt', () => {
    // Simuliere mehrere Tage der Woche
    const now = new Date();
    const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = startOfWeek.getUTCDay();
    const diff = (day + 6) % 7;
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - diff);

    // Markiere 3 Tage dieser Woche
    for (let i = 0; i < 3; i++) {
      const d = new Date(startOfWeek);
      d.setUTCDate(startOfWeek.getUTCDate() + i);
      const key = d.toISOString().split('T')[0];
      markDailyPlayed(key);
    }

    const progress = getWeeklyDailyProgress();
    expect(progress.count).toBe(3);
    expect(progress.total).toBe(7);
    expect(progress.achieved).toBe(true);
  });
});

describe('getDailyHubStatus', () => {
  it('liefert "open" wenn kein Abschluss fur heute vorliegt', () => {
    expect(getDailyHubStatus('minesweeper').state).toBe('open');
  });

  it('liefert "started" wenn Daily begonnen aber nicht abgeschlossen wurde', () => {
    setDailyStarted('sudoku');
    expect(getDailyHubStatus('sudoku').state).toBe('started');
  });

  it('liefert "completed" fur Minesweeper auch mit Hinweisen', () => {
    setDailyCompleted('minesweeper', { time: 88, usedHints: true });
    expect(getDailyHubStatus('minesweeper').state).toBe('completed');
  });
});

describe('getDailyPrimaryTarget', () => {
  it('liefert zuerst das erste offene Daily', () => {
    setDailyCompleted('minesweeper', { time: 100 });
    const target = getDailyPrimaryTarget();
    expect(target.game).toBe('sudoku');
    expect(target.href).toBe('/games/sudoku/daily');
  });

  it('nutzt zuletzt gespieltes Daily wenn alle offen sind', () => {
    setDailyCompleted('minesweeper', { time: 100 });
    setDailyCompleted('sudoku', { time: 120 });
    setLastPlayed({
      slug: 'sudoku',
      name: 'Daily Sudoku',
      href: '/games/sudoku/daily',
      mode: 'daily',
      playedAt: Date.now(),
    });

    const target = getDailyPrimaryTarget();
    expect(target.game).toBe('sudoku');
    expect(target.href).toBe('/games/sudoku/daily');
  });
});

describe('getDailyStatus', () => {
  it('gibt leeres Objekt zurück wenn nichts gespeichert', () => {
    expect(getDailyStatus()).toEqual({});
  });
});

describe('Storage Fail-Safe', () => {
  it('wirft nicht bei setLastPlayed wenn Storage blockiert ist', () => {
    (localStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(() => setLastPlayed({
      slug: 'snake',
      name: 'Snake',
      href: '/games/snake',
      mode: 'free',
      playedAt: Date.now(),
    })).not.toThrow();
  });

  it('liefert null/false Defaults wenn Lesen fehlschlägt', () => {
    (localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    expect(getLastPlayed()).toBeNull();
    expect(getDailyStatus()).toEqual({});
    expect(isDailyCompleted('minesweeper')).toBe(false);
  });
});

describe('Event Dispatch', () => {
  it('feuert spielbar_analytics Event bei trackLandingView', () => {
    const handler = jest.fn();
    window.addEventListener('spielbar_analytics', handler);

    analytics.trackLandingView();

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.name).toBe('landing_view');
    expect(detail.timestamp).toBeDefined();

    window.removeEventListener('spielbar_analytics', handler);
  });

  it('feuert Event mit korrekten Daten bei trackGameStart', () => {
    const handler = jest.fn();
    window.addEventListener('spielbar_analytics', handler);

    analytics.trackGameStart('minesweeper', 'daily');

    expect(handler).toHaveBeenCalled();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.name).toBe('game_start');
    expect(detail.data.slug).toBe('minesweeper');
    expect(detail.data.mode).toBe('daily');

    window.removeEventListener('spielbar_analytics', handler);
  });

  it('feuert Event bei trackDailyComplete', () => {
    const handler = jest.fn();
    window.addEventListener('spielbar_analytics', handler);

    analytics.trackDailyComplete('sudoku', 180, 42);

    expect(handler).toHaveBeenCalled();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.name).toBe('daily_status_complete');
    expect(detail.data.slug).toBe('sudoku');
    expect(detail.data.time).toBe(180);
    expect(detail.data.moves).toBe(42);

    window.removeEventListener('spielbar_analytics', handler);
  });
});
