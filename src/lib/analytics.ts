// Event Tracking System für Spielbar
// Konzeptionelle Messbarkeit - kann später an Analytics-Tool angebunden werden

export type EventName =
  | 'landing_view'
  | 'cta_play_today_click'
  | 'game_start'
  | 'game_end'
  | 'daily_status_complete'
  | 'nav_back_to_overview'
  | 'daily_card_impression'
  | 'daily_card_click'
  | 'featured_card_click'
  | 'continue_click'
  | 'tooltip_open'
  | 'game_restart'
  | 'game_exit_to_overview';

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

export interface LastPlayedEntry {
  slug: string;
  name: string;
  href: string;
  mode: GameMode;
  playedAt: number;
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

type GameStartMeta = {
  name?: string;
  href?: string;
};

const DEFAULT_GAME_NAMES: Record<string, string> = {
  minesweeper: 'Minesweeper',
  sudoku: 'Sudoku',
  snake: 'Snake',
  stacktower: 'Stack Tower',
  lemonadestand: 'Lemonade Stand',
};

const DAILY_GAME_NAMES: Record<string, string> = {
  minesweeper: 'Daily Logic Board',
  sudoku: 'Daily Sudoku',
};

function getDefaultGameName(slug: string, mode: GameMode): string {
  if (mode === 'daily') {
    return DAILY_GAME_NAMES[slug] || DEFAULT_GAME_NAMES[slug] || slug;
  }
  return DEFAULT_GAME_NAMES[slug] || slug;
}

function getDefaultGameHref(slug: string, mode: GameMode): string {
  return mode === 'daily' ? `/games/${slug}/daily` : `/games/${slug}`;
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
  trackGameStart: (slug: string, mode: GameMode, meta?: GameStartMeta) => {
    dispatchEvent('game_start', {
      slug,
      mode,
      timeToStart: Date.now() - getSessionStart(),
    });

    if (mode === 'daily') {
      markDailyPlayed();
    }

    if (typeof window !== 'undefined') {
      const entry: LastPlayedEntry = {
        slug,
        name: meta?.name || getDefaultGameName(slug, mode),
        href: meta?.href || getDefaultGameHref(slug, mode),
        mode,
        playedAt: Date.now(),
      };
      setLastPlayed(entry);
    }
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

  trackDailyCardImpression: (slug: string) => {
    dispatchEvent('daily_card_impression', { slug });
  },

  trackDailyCardClick: (slug: string) => {
    dispatchEvent('daily_card_click', { slug });
  },

  trackFeaturedCardClick: (slug: string) => {
    dispatchEvent('featured_card_click', { slug });
  },

  trackContinueClick: (slug: string) => {
    dispatchEvent('continue_click', { slug });
  },

  trackTooltipOpen: (tooltipId: string) => {
    dispatchEvent('tooltip_open', { tooltipId });
  },

  trackGameRestart: (slug: string, mode: GameMode) => {
    dispatchEvent('game_restart', { slug, mode });
  },

  trackExitToOverview: (from: string) => {
    dispatchEvent('game_exit_to_overview', {
      from,
      sessionLength: Date.now() - getSessionStart(),
    });
  },
};

// Daily Status helpers (localStorage-based)
const LAST_PLAYED_KEY = 'spielbar-last-played';
const DAILY_PLAYED_KEY = 'spielbar-daily-played';
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

function getStartOfWeekUTC(date: Date): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  const diff = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

function getDateKeyUTC(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function setLastPlayed(entry: LastPlayedEntry) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

export function getLastPlayed(): LastPlayedEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LAST_PLAYED_KEY);
    return stored ? (JSON.parse(stored) as LastPlayedEntry) : null;
  } catch {
    return null;
  }
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
    markDailyPlayed(today);
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

type DailyPlayed = Record<string, boolean>;

function getDailyPlayed(): DailyPlayed {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(DAILY_PLAYED_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function markDailyPlayed(dateKey: string = getTodayKey()) {
  if (typeof window === 'undefined') return;
  try {
    const played = getDailyPlayed();
    played[dateKey] = true;
    localStorage.setItem(DAILY_PLAYED_KEY, JSON.stringify(played));
  } catch {
    // Ignore storage errors
  }
}

export function getWeeklyDailyProgress() {
  const played = getDailyPlayed();
  const status = getDailyStatus();
  const start = getStartOfWeekUTC(new Date());
  let count = 0;

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const key = getDateKeyUTC(day);
    const completed = Boolean(
      status[key]?.minesweeper?.completed || status[key]?.sudoku?.completed
    );
    if (played[key] || completed) {
      count += 1;
    }
  }

  return { count, total: 7 };
}
