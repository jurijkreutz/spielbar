// Event Tracking System für Spielbar
// Konzeptionelle Messbarkeit - kann später an Analytics-Tool angebunden werden

import { readStorage, writeStorage } from './safeStorage';

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

export type DailyGameSlug = 'minesweeper' | 'sudoku';
export type DailyHubState = 'open' | 'started' | 'completed';

type DailyStatusEntry = {
  started?: boolean;
  completed: boolean;
  time?: number;
  moves?: number;
  usedHints?: boolean;
};

export interface DailyHubStatus {
  game: DailyGameSlug;
  state: DailyHubState;
  time?: number;
  moves?: number;
  usedHints?: boolean;
}

export const DAILY_PROGRESS_EVENT = 'spielbar_daily_progress_updated';
const WEEKLY_GOAL_DAYS = 3;
const DAILY_GAMES_IN_ORDER: DailyGameSlug[] = ['minesweeper', 'sudoku'];

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
  'stack-tower': 'Stack Tower',
  lemonadestand: 'Lemonade Stand',
  'brick-breaker': 'Brick Breaker',
};

const DAILY_GAME_NAMES: Record<string, string> = {
  minesweeper: 'Daily Minesweeper',
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
    minesweeper?: DailyStatusEntry;
    sudoku?: DailyStatusEntry;
  };
}

function emitDailyProgressEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DAILY_PROGRESS_EVENT, { detail: { updatedAt: Date.now() } }));
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
  try {
    writeStorage('local', LAST_PLAYED_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

export function getLastPlayed(): LastPlayedEntry | null {
  try {
    const stored = readStorage('local', LAST_PLAYED_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as LastPlayedEntry;

    // Legacy slug migration: stacktower -> stack-tower
    if (parsed?.slug === 'stacktower') {
      const migrated: LastPlayedEntry = {
        ...parsed,
        slug: 'stack-tower',
        href: parsed.href === '/games/stacktower' ? '/games/stack-tower' : parsed.href,
      };
      setLastPlayed(migrated);
      return migrated;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getDailyStatus(): DailyStatus {
  try {
    const stored = readStorage('local', DAILY_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setDailyCompleted(
  game: DailyGameSlug,
  data: { time?: number; moves?: number; usedHints?: boolean }
) {
  try {
    const status = getDailyStatus();
    const today = getTodayKey();
    if (!status[today]) {
      status[today] = {};
    }
    const existing = status[today][game];
    status[today][game] = { ...existing, started: true, completed: true, ...data };
    writeStorage('local', DAILY_STATUS_KEY, JSON.stringify(status));
    markDailyPlayed(today);
  } catch {
    // Ignore storage errors
  }
}

export function setDailyStarted(game: DailyGameSlug) {
  try {
    const status = getDailyStatus();
    const today = getTodayKey();
    if (!status[today]) {
      status[today] = {};
    }
    const existing = status[today][game];
    status[today][game] = { ...existing, started: true, completed: existing?.completed ?? false };
    writeStorage('local', DAILY_STATUS_KEY, JSON.stringify(status));
    markDailyPlayed(today);
  } catch {
    // Ignore storage errors
  }
}

export function isDailyCompleted(game: DailyGameSlug): boolean {
  const status = getDailyStatus();
  const today = getTodayKey();
  return status[today]?.[game]?.completed ?? false;
}

export function getTodaysDailyInfo(game: DailyGameSlug): DailyStatusEntry | null {
  const status = getDailyStatus();
  const today = getTodayKey();
  return status[today]?.[game] ?? null;
}

export function getDailyHubStatus(game: DailyGameSlug): DailyHubStatus {
  const info = getTodaysDailyInfo(game);
  if (!info?.completed) {
    if (info?.started) {
      return { game, state: 'started' };
    }
    return { game, state: 'open' };
  }

  return {
    game,
    state: 'completed',
    time: info.time,
    moves: info.moves,
    usedHints: info.usedHints,
  };
}

function getDailyHref(game: DailyGameSlug): string {
  return game === 'minesweeper' ? '/games/minesweeper/daily' : '/games/sudoku/daily';
}

export function getDailyPrimaryTarget(): { game: DailyGameSlug; href: string } {
  for (const game of DAILY_GAMES_IN_ORDER) {
    const status = getDailyHubStatus(game);
    if (status.state === 'open') {
      return { game, href: getDailyHref(game) };
    }
  }

  const lastPlayed = getLastPlayed();
  if (
    lastPlayed?.mode === 'daily' &&
    (lastPlayed.slug === 'minesweeper' || lastPlayed.slug === 'sudoku')
  ) {
    return {
      game: lastPlayed.slug,
      href: lastPlayed.href || getDailyHref(lastPlayed.slug),
    };
  }

  return { game: 'minesweeper', href: getDailyHref('minesweeper') };
}

type DailyPlayed = Record<string, boolean>;

function getDailyPlayed(): DailyPlayed {
  try {
    const stored = readStorage('local', DAILY_PLAYED_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function markDailyPlayed(dateKey: string = getTodayKey()) {
  try {
    const played = getDailyPlayed();
    played[dateKey] = true;
    writeStorage('local', DAILY_PLAYED_KEY, JSON.stringify(played));
    emitDailyProgressEvent();
  } catch {
    // Ignore storage errors
  }
}

export function getWeeklyDailyProgress() {
  const played = getDailyPlayed();
  const status = getDailyStatus();
  const start = getStartOfWeekUTC(new Date());
  const activeDayKeysByWeek = new Map<string, Set<string>>();
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

  for (const key of Object.keys(played)) {
    if (!played[key]) continue;
    const date = new Date(`${key}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) continue;
    const weekKey = getDateKeyUTC(getStartOfWeekUTC(date));
    if (!activeDayKeysByWeek.has(weekKey)) {
      activeDayKeysByWeek.set(weekKey, new Set());
    }
    activeDayKeysByWeek.get(weekKey)!.add(key);
  }

  for (const [key, games] of Object.entries(status)) {
    const completed = Boolean(games.minesweeper?.completed || games.sudoku?.completed);
    if (!completed) continue;
    const date = new Date(`${key}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) continue;
    const weekKey = getDateKeyUTC(getStartOfWeekUTC(date));
    if (!activeDayKeysByWeek.has(weekKey)) {
      activeDayKeysByWeek.set(weekKey, new Set());
    }
    activeDayKeysByWeek.get(weekKey)!.add(key);
  }

  const goal = WEEKLY_GOAL_DAYS;
  const weekAchieved = new Set<string>();

  for (const [weekKey, daySet] of activeDayKeysByWeek.entries()) {
    if (daySet.size >= goal) {
      weekAchieved.add(weekKey);
    }
  }

  const currentWeekKey = getDateKeyUTC(start);
  const achieved = count >= goal;
  const streakProbe = new Date(start);
  if (!weekAchieved.has(currentWeekKey)) {
    streakProbe.setUTCDate(streakProbe.getUTCDate() - 7);
  }

  let weekStreak = 0;
  while (weekAchieved.has(getDateKeyUTC(streakProbe))) {
    weekStreak += 1;
    streakProbe.setUTCDate(streakProbe.getUTCDate() - 7);
  }

  return { count, total: 7, goal, achieved, weekStreak };
}
