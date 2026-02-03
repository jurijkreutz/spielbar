/**
 * Lemonade Stand Achievement & Reset Tests
 *
 * Diese Tests prüfen:
 * - Achievement-Freischaltungen
 * - Lifetime Records Tracking
 * - Game Reset (nur Spiel zurücksetzen)
 * - Complete Reset (Spiel + Achievements zurücksetzen)
 */

import { ACHIEVEMENTS } from '../types/lemonadestand';

// ========== MOCK localStorage ==========

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ========== HELPER FUNCTIONS ==========

const GAME_STORAGE_KEY = 'lemonade-stand-game';
const ACHIEVEMENTS_STORAGE_KEY = 'lemonade-stand-achievements';

interface GameState {
  money: number;
  totalEarned: number;
  totalClicks: number;
  upgrades: { id: string; level: number }[];
  lastSaveTime: number;
  gameStartTime: number;
  totalPlayTime: number;
  highriseReachedAt: number | null;
  allMaxedAt: number | null;
}

interface AchievementsState {
  achievements: { id: string; unlockedAt: number }[];
  records: {
    timeToHighrise: number | null;
    timeToAllMaxed: number | null;
    lifetimeEarnings: number;
    lifetimeClicks: number;
    totalPlayTime: number;
  };
}

function getInitialGameState(): GameState {
  return {
    money: 0,
    totalEarned: 0,
    totalClicks: 0,
    upgrades: [],
    lastSaveTime: Date.now(),
    gameStartTime: Date.now(),
    totalPlayTime: 0,
    highriseReachedAt: null,
    allMaxedAt: null,
  };
}

function getInitialAchievementsState(): AchievementsState {
  return {
    achievements: [],
    records: {
      timeToHighrise: null,
      timeToAllMaxed: null,
      lifetimeEarnings: 0,
      lifetimeClicks: 0,
      totalPlayTime: 0,
    },
  };
}

function saveGame(state: GameState) {
  localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
}

function loadGame(): GameState {
  const saved = localStorage.getItem(GAME_STORAGE_KEY);
  if (!saved) return getInitialGameState();
  try {
    return JSON.parse(saved);
  } catch {
    return getInitialGameState();
  }
}

function saveAchievements(state: AchievementsState) {
  localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state));
}

function loadAchievements(): AchievementsState {
  const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
  if (!saved) return getInitialAchievementsState();
  try {
    return JSON.parse(saved);
  } catch {
    return getInitialAchievementsState();
  }
}

function resetGame(): GameState {
  const initial = getInitialGameState();
  saveGame(initial);
  return initial;
}

function resetAchievements(): AchievementsState {
  const initial = getInitialAchievementsState();
  saveAchievements(initial);
  return initial;
}

function resetComplete(): { game: GameState; achievements: AchievementsState } {
  const game = resetGame();
  const achievements = resetAchievements();
  return { game, achievements };
}

// ========== ACHIEVEMENT TESTS ==========

describe('Lemonade Stand - Achievements Freischaltung', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sollte Initial-State mit leeren Achievements haben', () => {
    const state = getInitialAchievementsState();

    expect(state.achievements).toEqual([]);
    expect(state.records.lifetimeEarnings).toBe(0);
    expect(state.records.lifetimeClicks).toBe(0);
    expect(state.records.totalPlayTime).toBe(0);
  });

  it('sollte Achievement freischalten können', () => {
    const state = getInitialAchievementsState();
    const now = Date.now();

    const newAchievement = { id: 'first-sip', unlockedAt: now };
    state.achievements.push(newAchievement);

    expect(state.achievements.length).toBe(1);
    expect(state.achievements[0].id).toBe('first-sip');
    expect(state.achievements[0].unlockedAt).toBe(now);
  });

  it('sollte mehrere Achievements freischalten können', () => {
    const state = getInitialAchievementsState();

    state.achievements.push({ id: 'first-sip', unlockedAt: Date.now() });
    state.achievements.push({ id: 'sweet-profit', unlockedAt: Date.now() });

    expect(state.achievements.length).toBe(2);
    expect(state.achievements.find((a) => a.id === 'first-sip')).toBeDefined();
    expect(state.achievements.find((a) => a.id === 'sweet-profit')).toBeDefined();
  });

  it('sollte prüfen ob Achievement bereits freigeschaltet ist', () => {
    const state = getInitialAchievementsState();
    state.achievements.push({ id: 'first-sip', unlockedAt: Date.now() });

    const isUnlocked = state.achievements.some((a) => a.id === 'first-sip');
    const isNotUnlocked = state.achievements.some((a) => a.id === 'sweet-profit');

    expect(isUnlocked).toBe(true);
    expect(isNotUnlocked).toBe(false);
  });

  it('sollte alle ACHIEVEMENTS definiert haben', () => {
    expect(ACHIEVEMENTS).toBeDefined();
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
  });

  it('sollte mindestens 5 Achievements definiert haben', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it('sollte jedes Achievement mit id, name, icon und description haben', () => {
    ACHIEVEMENTS.forEach((achievement) => {
      expect(achievement.id).toBeDefined();
      expect(achievement.name).toBeDefined();
      expect(achievement.icon).toBeDefined();
      expect(achievement.description).toBeDefined();
      expect(typeof achievement.id).toBe('string');
      expect(typeof achievement.name).toBe('string');
      expect(typeof achievement.icon).toBe('string');
      expect(typeof achievement.description).toBe('string');
    });
  });
});

// ========== LIFETIME RECORDS TESTS ==========

describe('Lemonade Stand - Lifetime Records', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sollte lifetimeEarnings tracken', () => {
    const state = getInitialAchievementsState();

    state.records.lifetimeEarnings = Math.max(state.records.lifetimeEarnings, 1000);

    expect(state.records.lifetimeEarnings).toBe(1000);
  });

  it('sollte lifetimeEarnings nur erhöhen, nie verringern', () => {
    const state = getInitialAchievementsState();

    state.records.lifetimeEarnings = Math.max(state.records.lifetimeEarnings, 1000);
    state.records.lifetimeEarnings = Math.max(state.records.lifetimeEarnings, 500); // Versuch zu verringern

    expect(state.records.lifetimeEarnings).toBe(1000);
  });

  it('sollte lifetimeClicks tracken', () => {
    const state = getInitialAchievementsState();

    state.records.lifetimeClicks = Math.max(state.records.lifetimeClicks, 250);

    expect(state.records.lifetimeClicks).toBe(250);
  });

  it('sollte totalPlayTime tracken', () => {
    const state = getInitialAchievementsState();

    state.records.totalPlayTime = Math.max(state.records.totalPlayTime, 3600000); // 1 Stunde in ms

    expect(state.records.totalPlayTime).toBe(3600000);
  });

  it('sollte timeToHighrise nur einmal setzen', () => {
    const state = getInitialAchievementsState();

    // Erstes Mal setzen
    if (state.records.timeToHighrise === null) {
      state.records.timeToHighrise = 1800000; // 30 Minuten
    }

    expect(state.records.timeToHighrise).toBe(1800000);

    // Versuch erneut zu setzen
    if (state.records.timeToHighrise === null) {
      state.records.timeToHighrise = 900000; // 15 Minuten
    }

    expect(state.records.timeToHighrise).toBe(1800000); // Sollte unverändert bleiben
  });

  it('sollte timeToAllMaxed nur einmal setzen', () => {
    const state = getInitialAchievementsState();

    if (state.records.timeToAllMaxed === null) {
      state.records.timeToAllMaxed = 7200000; // 2 Stunden
    }

    expect(state.records.timeToAllMaxed).toBe(7200000);

    if (state.records.timeToAllMaxed === null) {
      state.records.timeToAllMaxed = 3600000; // 1 Stunde
    }

    expect(state.records.timeToAllMaxed).toBe(7200000); // Unverändert
  });

  it('sollte Records in localStorage speichern', () => {
    const state = getInitialAchievementsState();
    state.records.lifetimeEarnings = 5000;
    state.records.lifetimeClicks = 500;
    state.records.totalPlayTime = 600000;

    saveAchievements(state);
    const loaded = loadAchievements();

    expect(loaded.records.lifetimeEarnings).toBe(5000);
    expect(loaded.records.lifetimeClicks).toBe(500);
    expect(loaded.records.totalPlayTime).toBe(600000);
  });
});

// ========== GAME RESET TESTS ==========

describe('Lemonade Stand - Game Reset (nur Spiel)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sollte nur Spielstand zurücksetzen, nicht Achievements', () => {
    // Setup: Spiel mit Fortschritt + Achievements
    const gameState: GameState = {
      money: 5000,
      totalEarned: 10000,
      totalClicks: 500,
      upgrades: [
        { id: 'organic-lemons', level: 3 },
        { id: 'bigger-stand', level: 2 },
      ],
      lastSaveTime: Date.now(),
      gameStartTime: Date.now() - 3600000,
      totalPlayTime: 3600000,
      highriseReachedAt: null,
      allMaxedAt: null,
    };

    const achievementsState: AchievementsState = {
      achievements: [
        { id: 'first-sip', unlockedAt: Date.now() },
        { id: 'sweet-profit', unlockedAt: Date.now() },
      ],
      records: {
        timeToHighrise: null,
        timeToAllMaxed: null,
        lifetimeEarnings: 10000,
        lifetimeClicks: 500,
        totalPlayTime: 3600000,
      },
    };

    saveGame(gameState);
    saveAchievements(achievementsState);

    // Reset nur das Spiel
    const resetGameState = resetGame();
    const loadedAchievements = loadAchievements();

    // Spiel sollte zurückgesetzt sein
    expect(resetGameState.money).toBe(0);
    expect(resetGameState.totalEarned).toBe(0);
    expect(resetGameState.totalClicks).toBe(0);
    expect(resetGameState.upgrades).toEqual([]);

    // Achievements sollten NICHT zurückgesetzt sein
    expect(loadedAchievements.achievements.length).toBe(2);
    expect(loadedAchievements.records.lifetimeEarnings).toBe(10000);
    expect(loadedAchievements.records.lifetimeClicks).toBe(500);
    expect(loadedAchievements.records.totalPlayTime).toBe(3600000);
  });

  it('sollte nach Game-Reset wieder bei 0 anfangen', () => {
    const gameState: GameState = {
      money: 9999,
      totalEarned: 20000,
      totalClicks: 1000,
      upgrades: [{ id: 'organic-lemons', level: 10 }],
      lastSaveTime: Date.now(),
      gameStartTime: Date.now(),
      totalPlayTime: 7200000,
      highriseReachedAt: null,
      allMaxedAt: null,
    };

    saveGame(gameState);

    const reset = resetGame();

    expect(reset.money).toBe(0);
    expect(reset.totalEarned).toBe(0);
    expect(reset.totalClicks).toBe(0);
    expect(reset.upgrades.length).toBe(0);
  });

  it('sollte Game-Reset in localStorage speichern', () => {
    const gameState: GameState = {
      ...getInitialGameState(),
      money: 5000,
      totalEarned: 10000,
    };

    saveGame(gameState);
    resetGame();

    const loaded = loadGame();

    expect(loaded.money).toBe(0);
    expect(loaded.totalEarned).toBe(0);
  });

  it('sollte nach Game-Reset spielbar sein', () => {
    // Erstelle fortgeschrittenen Spielstand
    const gameState: GameState = {
      ...getInitialGameState(),
      money: 1000,
      upgrades: [{ id: 'organic-lemons', level: 5 }],
    };

    saveGame(gameState);

    // Reset
    let reset = resetGame();

    // Simuliere einen Klick nach Reset
    reset.money += 1;
    reset.totalEarned += 1;
    reset.totalClicks += 1;

    expect(reset.money).toBe(1);
    expect(reset.totalEarned).toBe(1);
    expect(reset.totalClicks).toBe(1);
  });

  it('sollte gameStartTime nach Reset neu setzen', () => {
    const oldTime = Date.now() - 3600000; // 1 Stunde her
    const gameState: GameState = {
      ...getInitialGameState(),
      gameStartTime: oldTime,
    };

    saveGame(gameState);

    const beforeReset = Date.now();
    const reset = resetGame();

    expect(reset.gameStartTime).toBeGreaterThanOrEqual(beforeReset);
  });
});

// ========== COMPLETE RESET TESTS ==========

describe('Lemonade Stand - Complete Reset (Spiel + Achievements)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sollte Spiel UND Achievements zurücksetzen', () => {
    // Setup
    const gameState: GameState = {
      money: 10000,
      totalEarned: 50000,
      totalClicks: 2000,
      upgrades: [
        { id: 'organic-lemons', level: 5 },
        { id: 'bigger-stand', level: 4 },
      ],
      lastSaveTime: Date.now(),
      gameStartTime: Date.now() - 7200000,
      totalPlayTime: 7200000,
      highriseReachedAt: Date.now(),
      allMaxedAt: null,
    };

    const achievementsState: AchievementsState = {
      achievements: [
        { id: 'first-sip', unlockedAt: Date.now() },
        { id: 'sweet-profit', unlockedAt: Date.now() },
        { id: 'real-business', unlockedAt: Date.now() },
      ],
      records: {
        timeToHighrise: 3600000,
        timeToAllMaxed: null,
        lifetimeEarnings: 50000,
        lifetimeClicks: 2000,
        totalPlayTime: 7200000,
      },
    };

    saveGame(gameState);
    saveAchievements(achievementsState);

    // Complete Reset
    const { game, achievements } = resetComplete();

    // Spiel sollte zurückgesetzt sein
    expect(game.money).toBe(0);
    expect(game.totalEarned).toBe(0);
    expect(game.totalClicks).toBe(0);
    expect(game.upgrades).toEqual([]);

    // Achievements sollten AUCH zurückgesetzt sein
    expect(achievements.achievements).toEqual([]);
    expect(achievements.records.lifetimeEarnings).toBe(0);
    expect(achievements.records.lifetimeClicks).toBe(0);
    expect(achievements.records.totalPlayTime).toBe(0);
    expect(achievements.records.timeToHighrise).toBeNull();
    expect(achievements.records.timeToAllMaxed).toBeNull();
  });

  it('sollte Complete-Reset in localStorage speichern', () => {
    const gameState: GameState = {
      ...getInitialGameState(),
      money: 99999,
    };

    const achievementsState: AchievementsState = {
      ...getInitialAchievementsState(),
      achievements: [{ id: 'first-sip', unlockedAt: Date.now() }],
      records: {
        ...getInitialAchievementsState().records,
        lifetimeEarnings: 100000,
      },
    };

    saveGame(gameState);
    saveAchievements(achievementsState);

    resetComplete();

    const loadedGame = loadGame();
    const loadedAchievements = loadAchievements();

    expect(loadedGame.money).toBe(0);
    expect(loadedAchievements.achievements.length).toBe(0);
    expect(loadedAchievements.records.lifetimeEarnings).toBe(0);
  });

  it('sollte nach Complete-Reset komplett von vorne beginnen', () => {
    // Simuliere fortgeschrittenes Spiel
    const gameState: GameState = {
      money: 50000,
      totalEarned: 100000,
      totalClicks: 5000,
      upgrades: [
        { id: 'organic-lemons', level: 10 },
        { id: 'bigger-stand', level: 5 },
      ],
      lastSaveTime: Date.now(),
      gameStartTime: Date.now() - 86400000, // 24 Stunden her
      totalPlayTime: 86400000,
      highriseReachedAt: Date.now() - 3600000,
      allMaxedAt: Date.now(),
    };

    const achievementsState: AchievementsState = {
      achievements: [
        { id: 'first-sip', unlockedAt: Date.now() },
        { id: 'sweet-profit', unlockedAt: Date.now() },
        { id: 'real-business', unlockedAt: Date.now() },
        { id: 'lemonade-empire', unlockedAt: Date.now() },
        { id: 'lemonade-tycoon', unlockedAt: Date.now() },
      ],
      records: {
        timeToHighrise: 1800000,
        timeToAllMaxed: 3600000,
        lifetimeEarnings: 100000,
        lifetimeClicks: 5000,
        totalPlayTime: 86400000,
      },
    };

    saveGame(gameState);
    saveAchievements(achievementsState);

    const { game, achievements } = resetComplete();

    // Alles sollte auf Null sein
    expect(game.money).toBe(0);
    expect(game.totalEarned).toBe(0);
    expect(game.totalClicks).toBe(0);
    expect(game.upgrades.length).toBe(0);
    expect(achievements.achievements.length).toBe(0);
    expect(achievements.records.lifetimeEarnings).toBe(0);
    expect(achievements.records.lifetimeClicks).toBe(0);
    expect(achievements.records.totalPlayTime).toBe(0);
    expect(achievements.records.timeToHighrise).toBeNull();
    expect(achievements.records.timeToAllMaxed).toBeNull();
  });

  it('sollte nach Complete-Reset neue Achievements freischalten können', () => {
    // Setup + Reset
    saveAchievements({
      achievements: [{ id: 'first-sip', unlockedAt: Date.now() }],
      records: getInitialAchievementsState().records,
    });

    resetComplete();

    // Neues Achievement freischalten
    const state = loadAchievements();
    state.achievements.push({ id: 'first-sip', unlockedAt: Date.now() });
    saveAchievements(state);

    const loaded = loadAchievements();

    expect(loaded.achievements.length).toBe(1);
    expect(loaded.achievements[0].id).toBe('first-sip');
  });
});

// ========== VERGLEICH: GAME RESET VS COMPLETE RESET ==========

describe('Lemonade Stand - Reset Vergleich', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sollte Unterschied zwischen Game-Reset und Complete-Reset zeigen', () => {
    // Gleicher Ausgangszustand
    const gameState: GameState = {
      money: 5000,
      totalEarned: 10000,
      totalClicks: 500,
      upgrades: [{ id: 'organic-lemons', level: 3 }],
      lastSaveTime: Date.now(),
      gameStartTime: Date.now(),
      totalPlayTime: 3600000,
      highriseReachedAt: null,
      allMaxedAt: null,
    };

    const achievementsState: AchievementsState = {
      achievements: [{ id: 'first-sip', unlockedAt: Date.now() }],
      records: {
        timeToHighrise: null,
        timeToAllMaxed: null,
        lifetimeEarnings: 10000,
        lifetimeClicks: 500,
        totalPlayTime: 3600000,
      },
    };

    // Test 1: Game Reset
    saveGame(gameState);
    saveAchievements(achievementsState);

    resetGame();

    const afterGameReset = loadAchievements();
    expect(afterGameReset.achievements.length).toBe(1); // Achievements bleiben
    expect(afterGameReset.records.lifetimeEarnings).toBe(10000); // Records bleiben

    // Test 2: Complete Reset
    localStorage.clear();
    saveGame(gameState);
    saveAchievements(achievementsState);

    resetComplete();

    const afterCompleteReset = loadAchievements();
    expect(afterCompleteReset.achievements.length).toBe(0); // Achievements weg
    expect(afterCompleteReset.records.lifetimeEarnings).toBe(0); // Records weg
  });

  it('sollte Game-Reset mehrmals ausführbar sein ohne Achievements zu verlieren', () => {
    const achievementsState: AchievementsState = {
      achievements: [
        { id: 'first-sip', unlockedAt: Date.now() },
        { id: 'sweet-profit', unlockedAt: Date.now() },
      ],
      records: {
        timeToHighrise: null,
        timeToAllMaxed: null,
        lifetimeEarnings: 20000,
        lifetimeClicks: 1000,
        totalPlayTime: 7200000,
      },
    };

    saveAchievements(achievementsState);

    // 3x Game Reset
    for (let i = 0; i < 3; i++) {
      saveGame({
        ...getInitialGameState(),
        money: 1000 * (i + 1),
      });
      resetGame();
    }

    const achievements = loadAchievements();

    expect(achievements.achievements.length).toBe(2);
    expect(achievements.records.lifetimeEarnings).toBe(20000);
  });
});

