// Event Tracking System für Spielbar
// Konzeptionelle Messbarkeit - kann später an Analytics-Tool angebunden werden

export type EventName =
  | 'landing_view'
  | 'cta_play_today_click'
  | 'game_start'
  | 'game_end'
  | 'daily_status_complete'
  | 'nav_back_to_overview';

export type GameMode = 'free' | 'daily';
export type GameResult = 'win' | 'lose';

export interface GameStartEvent {
  slug: string;
  mode: GameMode;
}

export interface GameEndEvent {
  slug: string;
  mode: GameMode;
  result: GameResult;
  duration: number; // in seconds
}

export interface DailyCompleteEvent {
  slug: string;
  time?: number;
  moves?: number;
  usedHints?: boolean;
}

// Internal event dispatcher - can be connected to analytics later
function dispatchEvent(name: EventName, data?: Record<string, unknown>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${name}`, data || '');
  }

  // Emit custom event for potential listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('spielbar_analytics', {
        detail: { name, data, timestamp: Date.now() },
      })
    );
  }
}

// Track session start time
let sessionStartTime: number | null = null;

function getSessionStart(): number {
  if (sessionStartTime === null && typeof window !== 'undefined') {
    sessionStartTime = Date.now();
  }
  return sessionStartTime || Date.now();
}

// Public tracking functions
export const analytics = {
  // Landing page viewed
  trackLandingView: () => {
    getSessionStart(); // Initialize session
    dispatchEvent('landing_view');
  },

  // Primary CTA clicked
  trackPlayTodayClick: () => {
    dispatchEvent('cta_play_today_click', {
      timeToClick: Date.now() - getSessionStart(),
    });
  },

  // Game started
  trackGameStart: (slug: string, mode: GameMode) => {
    dispatchEvent('game_start', {
      slug,
      mode,
      timeToStart: Date.now() - getSessionStart(),
    });
  },

  // Game ended
  trackGameEnd: (slug: string, mode: GameMode, result: GameResult, duration: number) => {
    dispatchEvent('game_end', {
      slug,
      mode,
      result,
      duration,
    });
  },

  // Daily completed
  trackDailyComplete: (slug: string, time?: number, moves?: number, usedHints?: boolean) => {
    dispatchEvent('daily_status_complete', {
      slug,
      time,
      moves,
      usedHints,
    });
  },

  // Navigation back to overview
  trackNavToOverview: (from: string) => {
    dispatchEvent('nav_back_to_overview', {
      from,
      sessionLength: Date.now() - getSessionStart(),
    });
  },
};

// Daily Status helpers (localStorage-based)
const DAILY_STATUS_KEY = 'spielbar-daily-status';

interface DailyStatus {
  [dateKey: string]: {
    minesweeper?: { completed: boolean; time?: number; usedHints?: boolean };
    sudoku?: { completed: boolean; time?: number };
  };
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyStatus(): DailyStatus {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(DAILY_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setDailyCompleted(
  game: 'minesweeper' | 'sudoku',
  data: { time?: number; usedHints?: boolean }
) {
  if (typeof window === 'undefined') return;
  try {
    const status = getDailyStatus();
    const today = getTodayKey();
    if (!status[today]) {
      status[today] = {};
    }
    status[today][game] = { completed: true, ...data };
    localStorage.setItem(DAILY_STATUS_KEY, JSON.stringify(status));
  } catch {
    // Ignore storage errors
  }
}

export function isDailyCompleted(game: 'minesweeper' | 'sudoku'): boolean {
  const status = getDailyStatus();
  const today = getTodayKey();
  return status[today]?.[game]?.completed ?? false;
}

export function getTodaysDailyInfo(game: 'minesweeper' | 'sudoku') {
  const status = getDailyStatus();
  const today = getTodayKey();
  return status[today]?.[game] ?? null;
}

