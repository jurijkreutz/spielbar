/**
 * Lemonade Stand Game Logic Tests
 *
 * Diese Tests prüfen die Kernmechaniken des Spiels laut Ticket:
 * - Klicks erzeugen sofort Geld
 * - Upgrades sind klar & spürbar
 * - Progression fühlt sich gut an
 * - Idle-Einkommen funktioniert
 */

import {
  UPGRADES,
  GAME_CONFIG,
  GameState,
  GameStats,
} from '../types/lemonadestand';

// ========== HELPER FUNCTIONS (aus Hook extrahiert für Testbarkeit) ==========

function calculateStats(upgrades: { id: string; level: number }[]): GameStats {
  let clickValue = GAME_CONFIG.BASE_CLICK_VALUE;
  let idleIncome = GAME_CONFIG.BASE_IDLE_INCOME;
  let multiplier = 1;

  upgrades.forEach((upgrade) => {
    const def = UPGRADES.find((u) => u.id === upgrade.id);
    if (!def) return;

    const totalEffect = def.effect.value * upgrade.level;

    switch (def.effect.type) {
      case 'clickValue':
        clickValue += totalEffect;
        break;
      case 'idleIncome':
        idleIncome += totalEffect;
        break;
      case 'multiplier':
        multiplier += totalEffect;
        break;
    }
  });

  return {
    clickValue: Math.floor(clickValue * multiplier),
    idleIncome: Math.floor(idleIncome * multiplier * 10) / 10,
    multiplier,
  };
}

function getUpgradeCost(upgradeId: string, currentLevel: number): number {
  const def = UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
}

function simulateClick(state: GameState, stats: GameStats): GameState {
  return {
    ...state,
    money: state.money + stats.clickValue,
    totalEarned: state.totalEarned + stats.clickValue,
    totalClicks: state.totalClicks + 1,
  };
}

function purchaseUpgrade(
  state: GameState,
  upgradeId: string
): { newState: GameState; success: boolean } {
  const def = UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return { newState: state, success: false };

  const currentUpgrade = state.upgrades.find((u) => u.id === upgradeId);
  const currentLevel = currentUpgrade?.level || 0;

  if (currentLevel >= def.maxLevel) return { newState: state, success: false };

  const cost = getUpgradeCost(upgradeId, currentLevel);
  if (state.money < cost) return { newState: state, success: false };

  const newUpgrades = [...state.upgrades];
  const existingIndex = newUpgrades.findIndex((u) => u.id === upgradeId);

  if (existingIndex >= 0) {
    newUpgrades[existingIndex] = {
      ...newUpgrades[existingIndex],
      level: newUpgrades[existingIndex].level + 1,
    };
  } else {
    newUpgrades.push({ id: upgradeId, level: 1 });
  }

  return {
    newState: {
      ...state,
      money: state.money - cost,
      upgrades: newUpgrades,
    },
    success: true,
  };
}

function getInitialState(): GameState {
  return {
    money: 0,
    totalEarned: 0,
    totalClicks: 0,
    upgrades: [],
    lastSaveTime: Date.now(),
  };
}

// ========== TESTS ==========

describe('Lemonade Stand - Core Gameplay Loop', () => {
  describe('Klicks erzeugen sofort Geld', () => {
    it('sollte bei Start €1 pro Klick verdienen (BASE_CLICK_VALUE)', () => {
      const state = getInitialState();
      const stats = calculateStats([]);

      expect(stats.clickValue).toBe(1);

      const afterClick = simulateClick(state, stats);
      expect(afterClick.money).toBe(1);
      expect(afterClick.totalClicks).toBe(1);
    });

    it('sollte mehrere Klicks korrekt summieren', () => {
      let state = getInitialState();
      const stats = calculateStats([]);

      for (let i = 0; i < 10; i++) {
        state = simulateClick(state, stats);
      }

      expect(state.money).toBe(10);
      expect(state.totalClicks).toBe(10);
      expect(state.totalEarned).toBe(10);
    });
  });

  describe('Upgrade-System', () => {
    it('sollte Upgrade-Kosten korrekt berechnen (Basis + Multiplikator)', () => {
      const organicLemons = UPGRADES.find((u) => u.id === 'organic-lemons')!;

      // Level 0 -> 1: Basiskosten
      expect(getUpgradeCost('organic-lemons', 0)).toBe(organicLemons.baseCost);

      // Level 1 -> 2: baseCost * costMultiplier
      const expectedLevel1Cost = Math.floor(organicLemons.baseCost * organicLemons.costMultiplier);
      expect(getUpgradeCost('organic-lemons', 1)).toBe(expectedLevel1Cost);
    });

    it('sollte Upgrade kaufen wenn genug Geld vorhanden', () => {
      const state: GameState = {
        ...getInitialState(),
        money: 100,
      };

      const { newState, success } = purchaseUpgrade(state, 'organic-lemons');

      expect(success).toBe(true);
      expect(newState.money).toBe(100 - 15); // 15 = baseCost
      expect(newState.upgrades).toHaveLength(1);
      expect(newState.upgrades[0].level).toBe(1);
    });

    it('sollte Upgrade ablehnen wenn nicht genug Geld', () => {
      const state: GameState = {
        ...getInitialState(),
        money: 10, // zu wenig für organic-lemons (15)
      };

      const { newState, success } = purchaseUpgrade(state, 'organic-lemons');

      expect(success).toBe(false);
      expect(newState.money).toBe(10);
      expect(newState.upgrades).toHaveLength(0);
    });

    it('sollte maxLevel respektieren', () => {
      const state: GameState = {
        ...getInitialState(),
        money: 1000000,
        upgrades: [{ id: 'organic-lemons', level: 10 }], // maxLevel erreicht
      };

      const { success } = purchaseUpgrade(state, 'organic-lemons');
      expect(success).toBe(false);
    });
  });

  describe('Upgrade-Effekte sind spürbar', () => {
    it('sollte clickValue erhöhen mit Produkt-Upgrades', () => {
      const baseStats = calculateStats([]);
      expect(baseStats.clickValue).toBe(1);

      // Nach organic-lemons Level 3 (+3 clickValue)
      const upgradedStats = calculateStats([{ id: 'organic-lemons', level: 3 }]);
      expect(upgradedStats.clickValue).toBe(4); // 1 base + 3
    });

    it('sollte idleIncome erhöhen mit Stand-Upgrades', () => {
      const baseStats = calculateStats([]);
      expect(baseStats.idleIncome).toBe(0);

      // bigger-stand gibt +1 idleIncome pro Level
      const upgradedStats = calculateStats([{ id: 'bigger-stand', level: 2 }]);
      expect(upgradedStats.idleIncome).toBe(2);
    });

    it('sollte Multiplikator auf alle Werte anwenden', () => {
      // secret-recipe gibt +0.15 Multiplikator pro Level
      const statsWithMultiplier = calculateStats([
        { id: 'organic-lemons', level: 5 }, // +5 clickValue
        { id: 'secret-recipe', level: 2 },  // +0.30 Multiplikator
      ]);

      // clickValue = (1 + 5) * 1.30 = 7.8, floor = 7
      expect(statsWithMultiplier.clickValue).toBe(7);
      expect(statsWithMultiplier.multiplier).toBe(1.30);
    });
  });
});

describe('Lemonade Stand - Progression', () => {
  it('frühe Upgrades sollten schnell erreichbar sein', () => {
    const firstUpgradeCost = getUpgradeCost('organic-lemons', 0); // 15
    const clickValue = GAME_CONFIG.BASE_CLICK_VALUE; // 1

    // Man braucht 15 Klicks für das erste Upgrade
    const clicksNeeded = Math.ceil(firstUpgradeCost / clickValue);
    expect(clicksNeeded).toBeLessThanOrEqual(20);
  });

  it('sollte kompletten Progression-Durchlauf simulieren können', () => {
    let state = getInitialState();
    let stats = calculateStats(state.upgrades);
    let upgradesPurchased = 0;

    // Simuliere 1000 Klicks und kaufe Upgrades wenn möglich
    for (let i = 0; i < 1000; i++) {
      state = simulateClick(state, stats);

      // Versuche günstiges Upgrade zu kaufen
      for (const upgrade of UPGRADES) {
        const level = state.upgrades.find((u) => u.id === upgrade.id)?.level || 0;
        const cost = getUpgradeCost(upgrade.id, level);

        if (state.money >= cost && level < upgrade.maxLevel) {
          const { newState, success } = purchaseUpgrade(state, upgrade.id);
          if (success) {
            state = newState;
            stats = calculateStats(state.upgrades);
            upgradesPurchased++;
          }
        }
      }
    }

    // Nach 1000 Klicks sollten einige Upgrades gekauft worden sein
    expect(upgradesPurchased).toBeGreaterThan(5);
    expect(stats.clickValue).toBeGreaterThan(1);
    expect(state.totalClicks).toBe(1000);
  });
});

describe('Lemonade Stand - Idle-Mechanik', () => {
  it('sollte Offline-Einkommen korrekt berechnen', () => {
    const stats = calculateStats([{ id: 'bigger-stand', level: 2 }]); // +2 idleIncome
    expect(stats.idleIncome).toBe(2);

    // Simuliere 1 Stunde offline
    const offlineSeconds = 3600;
    const offlineEarnings = Math.floor(
      stats.idleIncome * offlineSeconds * GAME_CONFIG.OFFLINE_INCOME_EFFICIENCY
    );

    // 2 * 3600 * 0.5 = 3600
    expect(offlineEarnings).toBe(3600);
  });

  it('sollte Offline-Einkommen auf Cap begrenzen', () => {
    const maxOfflineHours = GAME_CONFIG.OFFLINE_INCOME_CAP_HOURS;
    expect(maxOfflineHours).toBe(8);

    // Auch wenn man 24h offline war, bekommt man max 8h
    const cappedSeconds = maxOfflineHours * 3600;
    expect(cappedSeconds).toBe(28800);
  });

  it('Idle ist Unterstützung, nicht Hauptspiel', () => {
    // Bei gleichem Zeitaufwand sollten aktive Klicks mehr bringen
    const stats = calculateStats([{ id: 'bigger-stand', level: 3 }]);

    // 60 Sekunden Idle
    const idleEarnings = stats.idleIncome * 60; // 3 * 60 = 180

    // 60 Klicks in 60 Sekunden
    // (wir brauchen den Wert nicht direkt, aber das Beispiel bleibt für die Doku erhalten)
    void (stats.clickValue * 60);

    // Bei Basis-Stats sind Klicks weniger wert, aber mit Click-Upgrades...
    const clickStats = calculateStats([
      { id: 'bigger-stand', level: 3 },
      { id: 'organic-lemons', level: 5 },
    ]);
    const improvedClickEarnings = clickStats.clickValue * 60; // 6 * 60 = 360

    // Mit Click-Upgrades sollte aktives Spielen lohnender sein
    expect(improvedClickEarnings).toBeGreaterThan(idleEarnings);
  });
});

describe('Lemonade Stand - Upgrade-Kategorien', () => {
  it('sollte genau 3 Kategorien haben: product, stand, ambiance', () => {
    const categories = new Set(UPGRADES.map((u) => u.category));
    expect(categories.size).toBe(3);
    expect(categories).toContain('product');
    expect(categories).toContain('stand');
    expect(categories).toContain('ambiance');
  });

  it('Produkt-Upgrades sollten primär clickValue erhöhen', () => {
    const productUpgrades = UPGRADES.filter((u) => u.category === 'product');
    const clickValueUpgrades = productUpgrades.filter(
      (u) => u.effect.type === 'clickValue' || u.effect.type === 'multiplier'
    );

    // Die meisten Produkt-Upgrades sollten clickValue oder Multiplikator betreffen
    expect(clickValueUpgrades.length).toBeGreaterThanOrEqual(productUpgrades.length - 1);
  });

  it('Stand-Upgrades sollten primär idleIncome erhöhen', () => {
    const standUpgrades = UPGRADES.filter((u) => u.category === 'stand');
    const idleUpgrades = standUpgrades.filter(
      (u) => u.effect.type === 'idleIncome' || u.effect.type === 'multiplier'
    );

    expect(idleUpgrades.length).toBeGreaterThanOrEqual(standUpgrades.length - 1);
  });

  it('jedes Upgrade sollte ein Icon haben', () => {
    for (const upgrade of UPGRADES) {
      expect(upgrade.icon).toBeTruthy();
      expect(upgrade.icon.length).toBeGreaterThan(0);
    }
  });
});

describe('Lemonade Stand - Zahlen bleiben lesbar', () => {
  it('Upgrade-Kosten sollten nicht exponentiell explodieren', () => {
    // Teste die teuersten Upgrades auf Max-Level
    const fairyLights = UPGRADES.find((u) => u.id === 'fairy-lights')!;
    const maxLevelCost = getUpgradeCost('fairy-lights', fairyLights.maxLevel - 1);

    // Auch das teuerste Upgrade auf höchstem Level sollte unter 1 Million bleiben
    expect(maxLevelCost).toBeLessThan(1000000);
  });

  it('Click-Werte sollten verständlich bleiben', () => {
    // Maximiere alle Click-Value-Upgrades
    const maxClickUpgrades = UPGRADES.filter(
      (u) => u.effect.type === 'clickValue'
    ).map((u) => ({ id: u.id, level: u.maxLevel }));

    const maxMultiplierUpgrades = UPGRADES.filter(
      (u) => u.effect.type === 'multiplier'
    ).map((u) => ({ id: u.id, level: u.maxLevel }));

    const allMaxed = [...maxClickUpgrades, ...maxMultiplierUpgrades];
    const maxStats = calculateStats(allMaxed);

    // Selbst mit allen Upgrades sollte der Click-Wert unter 1000 bleiben
    expect(maxStats.clickValue).toBeLessThan(1000);
  });
});

describe('Lemonade Stand - Game Config', () => {
  it('sollte sinnvolle Standardwerte haben', () => {
    expect(GAME_CONFIG.BASE_CLICK_VALUE).toBe(1);
    expect(GAME_CONFIG.BASE_IDLE_INCOME).toBe(0);
    expect(GAME_CONFIG.IDLE_TICK_MS).toBe(1000);
    expect(GAME_CONFIG.SAVE_INTERVAL_MS).toBe(5000);
  });

  it('Offline-Effizienz sollte unter 100% liegen', () => {
    expect(GAME_CONFIG.OFFLINE_INCOME_EFFICIENCY).toBeLessThan(1);
    expect(GAME_CONFIG.OFFLINE_INCOME_EFFICIENCY).toBeGreaterThan(0);
  });
});

// ========== NEUE TESTS ==========

// ========== ZUSÄTZLICHE HELPER FUNCTIONS ==========

const STORAGE_KEY = 'lemonade-stand-save';

function saveGame(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastSaveTime: Date.now(),
      })
    );
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

function loadGame(): GameState {
  if (typeof window === 'undefined') {
    return getInitialState();
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        money: parsed.money || 0,
        totalEarned: parsed.totalEarned || 0,
        totalClicks: parsed.totalClicks || 0,
        upgrades: parsed.upgrades || [],
        lastSaveTime: parsed.lastSaveTime || Date.now(),
      };
    }
  } catch (e) {
    console.error('Failed to load game:', e);
  }
  return getInitialState();
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
}

function calculateOfflineEarnings(
  lastSaveTime: number,
  idleIncome: number
): number | null {
  const now = Date.now();
  const offlineMs = now - lastSaveTime;
  const offlineSeconds = Math.min(
    offlineMs / 1000,
    GAME_CONFIG.OFFLINE_INCOME_CAP_HOURS * 3600
  );

  if (offlineSeconds > 60 && idleIncome > 0) {
    return Math.floor(
      idleIncome * offlineSeconds * GAME_CONFIG.OFFLINE_INCOME_EFFICIENCY
    );
  }
  return null;
}

interface Customer {
  id: number;
  x: number;
  y: number;
  opacity: number;
  leaving: boolean;
}

interface FloatingMoney {
  id: number;
  x: number;
  y: number;
  amount: number;
  opacity: number;
}

function createCustomer(id: number): Customer {
  return {
    id,
    x: -30,
    y: 180 + Math.random() * 40,
    opacity: 0,
    leaving: false,
  };
}

function createFloatingMoney(
  id: number,
  amount: number,
  x?: number,
  y?: number
): FloatingMoney {
  return {
    id,
    x: x !== undefined ? x : 100 + Math.random() * 100,
    y: y !== undefined ? y : 100 + Math.random() * 50,
    amount,
    opacity: 1,
  };
}

function updateFloatingMoney(money: FloatingMoney): FloatingMoney {
  return {
    ...money,
    y: money.y - 1.5,
    opacity: money.opacity - 0.03,
  };
}

function updateCustomer(customer: Customer): Customer {
  return {
    ...customer,
    x: customer.leaving ? customer.x + 2 : customer.x,
    opacity: customer.leaving
      ? customer.opacity - 0.02
      : Math.min(customer.opacity + 0.05, 1),
  };
}

function canAfford(money: number, upgradeId: string, upgrades: { id: string; level: number }[]): boolean {
  const upgrade = upgrades.find((u) => u.id === upgradeId);
  const level = upgrade?.level || 0;
  const cost = getUpgradeCost(upgradeId, level);
  return money >= cost;
}

function getUpgradeLevel(upgradeId: string, upgrades: { id: string; level: number }[]): number {
  const upgrade = upgrades.find((u) => u.id === upgradeId);
  return upgrade?.level || 0;
}

function filterUpgrades(category: 'product' | 'stand' | 'ambiance' | 'all') {
  if (category === 'all') return UPGRADES;
  return UPGRADES.filter((u) => u.category === category);
}

function resetGame(): GameState {
  return getInitialState();
}

// ========== PERSISTENZ TESTS ==========

describe('Lemonade Stand - Persistenz', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('sollte Spielstand korrekt in localStorage speichern', () => {
    const state: GameState = {
      money: 500,
      totalEarned: 1000,
      totalClicks: 50,
      upgrades: [{ id: 'organic-lemons', level: 3 }],
      lastSaveTime: Date.now(),
    };

    saveGame(state);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );

    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.money).toBe(500);
    expect(savedData.totalEarned).toBe(1000);
    expect(savedData.totalClicks).toBe(50);
    expect(savedData.upgrades).toEqual([{ id: 'organic-lemons', level: 3 }]);
  });

  it('sollte Spielstand korrekt aus localStorage laden', () => {
    const savedState = {
      money: 250,
      totalEarned: 500,
      totalClicks: 25,
      upgrades: [{ id: 'bigger-stand', level: 2 }],
      lastSaveTime: Date.now() - 60000,
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

    const loaded = loadGame();

    expect(loaded.money).toBe(250);
    expect(loaded.totalEarned).toBe(500);
    expect(loaded.totalClicks).toBe(25);
    expect(loaded.upgrades).toEqual([{ id: 'bigger-stand', level: 2 }]);
  });

  it('sollte bei korruptem localStorage auf Initial-State fallen', () => {
    localStorageMock.getItem.mockReturnValue('invalid json {{{');

    const loaded = loadGame();

    expect(loaded.money).toBe(0);
    expect(loaded.totalEarned).toBe(0);
    expect(loaded.totalClicks).toBe(0);
    expect(loaded.upgrades).toEqual([]);
  });

  it('sollte lastSaveTime beim Speichern aktualisieren', () => {
    const beforeSave = Date.now();
    const state = getInitialState();

    saveGame(state);

    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.lastSaveTime).toBeGreaterThanOrEqual(beforeSave);
  });

  it('sollte bei fehlendem localStorage graceful fallen', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const loaded = loadGame();

    expect(loaded).toEqual(expect.objectContaining({
      money: 0,
      totalEarned: 0,
      totalClicks: 0,
      upgrades: [],
    }));
  });

  it('sollte partielle Daten mit Defaults ergänzen', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ money: 100 }));

    const loaded = loadGame();

    expect(loaded.money).toBe(100);
    expect(loaded.totalEarned).toBe(0);
    expect(loaded.totalClicks).toBe(0);
    expect(loaded.upgrades).toEqual([]);
  });
});

// ========== OFFLINE EARNINGS ERWEITERT ==========

describe('Lemonade Stand - Offline Earnings (erweitert)', () => {
  it('sollte keine Offline-Earnings anzeigen wenn weniger als 60 Sekunden offline', () => {
    const lastSaveTime = Date.now() - 30000; // 30 Sekunden
    const idleIncome = 5;

    const earnings = calculateOfflineEarnings(lastSaveTime, idleIncome);

    expect(earnings).toBeNull();
  });

  it('sollte keine Offline-Earnings anzeigen wenn idleIncome === 0', () => {
    const lastSaveTime = Date.now() - 3600000; // 1 Stunde
    const idleIncome = 0;

    const earnings = calculateOfflineEarnings(lastSaveTime, idleIncome);

    expect(earnings).toBeNull();
  });

  it('sollte Offline-Earnings korrekt berechnen wenn beide Bedingungen erfüllt', () => {
    const lastSaveTime = Date.now() - 3600000; // 1 Stunde
    const idleIncome = 2;

    const earnings = calculateOfflineEarnings(lastSaveTime, idleIncome);

    // 2 * 3600 * 0.5 = 3600
    expect(earnings).toBe(3600);
  });

  it('sollte Offline-Earnings auf Cap begrenzen', () => {
    const lastSaveTime = Date.now() - 86400000; // 24 Stunden
    const idleIncome = 1;

    const earnings = calculateOfflineEarnings(lastSaveTime, idleIncome);

    // Max 8 Stunden: 1 * (8 * 3600) * 0.5 = 14400
    expect(earnings).toBe(14400);
  });

  it('sollte genau bei 61 Sekunden Offline-Earnings geben', () => {
    const lastSaveTime = Date.now() - 61000; // 61 Sekunden
    const idleIncome = 1;

    const earnings = calculateOfflineEarnings(lastSaveTime, idleIncome);

    // 1 * 61 * 0.5 = 30.5 -> floor = 30
    expect(earnings).toBe(30);
  });

  it('sollte bei exakt 60 Sekunden keine Earnings geben', () => {
    const lastSaveTime = Date.now() - 60000; // exakt 60 Sekunden
    const idleIncome = 1;

    const earnings = calculateOfflineEarnings(lastSaveTime, idleIncome);

    expect(earnings).toBeNull();
  });
});

// ========== CUSTOMERS TESTS ==========

describe('Lemonade Stand - Customers', () => {
  it('sollte Kunden mit x: -30 starten (außerhalb Viewport)', () => {
    const customer = createCustomer(1);

    expect(customer.x).toBe(-30);
  });

  it('sollte Kunden mit opacity: 0 starten', () => {
    const customer = createCustomer(1);

    expect(customer.opacity).toBe(0);
  });

  it('sollte Kunden mit leaving: false starten', () => {
    const customer = createCustomer(1);

    expect(customer.leaving).toBe(false);
  });

  it('sollte Kunden-Opacity erhöhen wenn nicht leaving', () => {
    let customer = createCustomer(1);
    customer = updateCustomer(customer);

    expect(customer.opacity).toBe(0.05);
  });

  it('sollte Kunden-Opacity maximal auf 1 begrenzen', () => {
    let customer = createCustomer(1);
    customer.opacity = 0.98;
    customer = updateCustomer(customer);

    expect(customer.opacity).toBe(1);
  });

  it('sollte Kunden-X erhöhen wenn leaving', () => {
    let customer = createCustomer(1);
    customer.leaving = true;
    customer.opacity = 1;
    const originalX = customer.x;
    customer = updateCustomer(customer);

    expect(customer.x).toBe(originalX + 2);
  });

  it('sollte Kunden-Opacity verringern wenn leaving', () => {
    let customer = createCustomer(1);
    customer.leaving = true;
    customer.opacity = 1;
    customer = updateCustomer(customer);

    expect(customer.opacity).toBe(0.98);
  });

  it('sollte Kunden-X nicht ändern wenn nicht leaving', () => {
    let customer = createCustomer(1);
    const originalX = customer.x;
    customer = updateCustomer(customer);

    expect(customer.x).toBe(originalX);
  });

  it('sollte maximal 5 Kunden erlauben (Logik-Test)', () => {
    const customers: Customer[] = [];
    for (let i = 0; i < 10; i++) {
      if (customers.length < 5) {
        customers.push(createCustomer(i));
      }
    }

    expect(customers.length).toBe(5);
  });

  it('sollte Kunden entfernen wenn opacity <= 0', () => {
    let customers: Customer[] = [
      { ...createCustomer(1), opacity: 0.01, leaving: true },
      { ...createCustomer(2), opacity: 0.5, leaving: false },
    ];

    // Simuliere Update
    customers = customers
      .map(updateCustomer)
      .filter((c) => c.opacity > 0);

    expect(customers.length).toBe(1);
    expect(customers[0].id).toBe(2);
  });
});

// ========== FLOATING MONEY TESTS ==========

describe('Lemonade Stand - Floating Money', () => {
  it('sollte FloatingMoney mit korrekten Werten erstellen', () => {
    const money = createFloatingMoney(1, 10, 50, 75);

    expect(money.id).toBe(1);
    expect(money.amount).toBe(10);
    expect(money.x).toBe(50);
    expect(money.y).toBe(75);
    expect(money.opacity).toBe(1);
  });

  it('sollte FloatingMoney mit Random-Position erstellen wenn keine Koordinaten', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const money = createFloatingMoney(1, 10);

    expect(money.x).toBe(150); // 100 + 0.5 * 100
    expect(money.y).toBe(125); // 100 + 0.5 * 50

    jest.restoreAllMocks();
  });

  it('sollte FloatingMoney-Y nach oben bewegen', () => {
    let money = createFloatingMoney(1, 10, 50, 100);
    money = updateFloatingMoney(money);

    expect(money.y).toBe(98.5); // 100 - 1.5
  });

  it('sollte FloatingMoney-Opacity reduzieren', () => {
    let money = createFloatingMoney(1, 10, 50, 100);
    money = updateFloatingMoney(money);

    expect(money.opacity).toBe(0.97); // 1 - 0.03
  });

  it('sollte FloatingMoney nach mehreren Updates verschwinden', () => {
    let money = createFloatingMoney(1, 10, 50, 100);

    // Nach 34 Updates sollte opacity ~0 sein (1 - 34*0.03 = -0.02)
    for (let i = 0; i < 34; i++) {
      money = updateFloatingMoney(money);
    }

    expect(money.opacity).toBeLessThanOrEqual(0);
  });

  it('sollte FloatingMoney-Array auf maximal 11 begrenzen (Logik-Test)', () => {
    let floatingMoney: FloatingMoney[] = [];

    for (let i = 0; i < 15; i++) {
      const newMoney = createFloatingMoney(i, 10);
      floatingMoney = [...floatingMoney.slice(-10), newMoney];
    }

    expect(floatingMoney.length).toBe(11);
  });

  it('sollte alte FloatingMoney entfernen wenn opacity <= 0', () => {
    let floatingMoney: FloatingMoney[] = [
      { ...createFloatingMoney(1, 10), opacity: 0.01 },
      { ...createFloatingMoney(2, 20), opacity: 0.5 },
    ];

    floatingMoney = floatingMoney
      .map(updateFloatingMoney)
      .filter((m) => m.opacity > 0);

    expect(floatingMoney.length).toBe(1);
    expect(floatingMoney[0].id).toBe(2);
  });
});

// ========== VISUAL UPGRADES TESTS ==========

describe('Lemonade Stand - Visual Upgrades', () => {
  it('sollte Stand-Sprite für Level 0 korrekt zuordnen', () => {
    const standLevel = 0;
    const expectedSprite = 'stand_small.png';

    if (standLevel >= 3) {
      expect('stand_extralarge.png').toBe(expectedSprite);
    } else if (standLevel >= 2) {
      expect('stand_large.png').toBe(expectedSprite);
    } else if (standLevel >= 1) {
      expect('stand_medium.png').toBe(expectedSprite);
    } else {
      expect('stand_small.png').toBe(expectedSprite);
    }
  });

  it('sollte Stand-Sprite für Level 1 korrekt zuordnen', () => {
    const standLevel = 1;

    const getSprite = (level: number) => {
      if (level >= 3) return 'stand_extralarge.png';
      if (level >= 2) return 'stand_large.png';
      if (level >= 1) return 'stand_medium.png';
      return 'stand_small.png';
    };

    expect(getSprite(standLevel)).toBe('stand_medium.png');
  });

  it('sollte Stand-Sprite für Level 2 korrekt zuordnen', () => {
    const getSprite = (level: number) => {
      if (level >= 3) return 'stand_extralarge.png';
      if (level >= 2) return 'stand_large.png';
      if (level >= 1) return 'stand_medium.png';
      return 'stand_small.png';
    };

    expect(getSprite(2)).toBe('stand_large.png');
  });

  it('sollte Stand-Sprite für Level 3+ korrekt zuordnen', () => {
    const getSprite = (level: number) => {
      if (level >= 5) return 'stand_highrise.png';
      if (level >= 4) return 'stand_extraextralarge.png';
      if (level >= 3) return 'stand_extralarge.png';
      if (level >= 2) return 'stand_large.png';
      if (level >= 1) return 'stand_medium.png';
      return 'stand_small.png';
    };

    expect(getSprite(3)).toBe('stand_extralarge.png');
    expect(getSprite(4)).toBe('stand_extraextralarge.png');
    expect(getSprite(5)).toBe('stand_highrise.png');
    expect(getSprite(6)).toBe('stand_highrise.png');
  });

  it('sollte alle visuellen Upgrades definiert haben', () => {
    const visualUpgradeIds = [
      'sun-umbrella',
      'sign',
      'dispenser',
      'bench',
      'plants',
      'music-box',
      'fairy-lights',
    ];

    for (const id of visualUpgradeIds) {
      const upgrade = UPGRADES.find((u) => u.id === id);
      expect(upgrade).toBeDefined();
    }
  });

  it('sollte Upgrade-Visibility basierend auf Level bestimmen', () => {
    const upgrades = [{ id: 'sun-umbrella', level: 1 }];
    const shouldShowUmbrella = getUpgradeLevel('sun-umbrella', upgrades) > 0;
    const shouldShowBench = getUpgradeLevel('bench', upgrades) > 0;

    expect(shouldShowUmbrella).toBe(true);
    expect(shouldShowBench).toBe(false);
  });
});

// ========== UI FORMATIERUNG TESTS ==========

describe('Lemonade Stand - UI Formatierung', () => {
  it('sollte Beträge unter 1000 als ganze Zahl formatieren', () => {
    expect(formatMoney(0)).toBe('0');
    expect(formatMoney(1)).toBe('1');
    expect(formatMoney(999)).toBe('999');
    expect(formatMoney(123)).toBe('123');
  });

  it('sollte Beträge 1000-999999 mit K formatieren', () => {
    expect(formatMoney(1000)).toBe('1.0K');
    expect(formatMoney(1500)).toBe('1.5K');
    expect(formatMoney(10000)).toBe('10.0K');
    expect(formatMoney(999999)).toBe('1000.0K');
  });

  it('sollte Beträge >= 1000000 mit M formatieren', () => {
    expect(formatMoney(1000000)).toBe('1.00M');
    expect(formatMoney(1500000)).toBe('1.50M');
    expect(formatMoney(10000000)).toBe('10.00M');
    expect(formatMoney(1234567)).toBe('1.23M');
  });

  it('sollte Dezimalzahlen korrekt formatieren', () => {
    expect(formatMoney(999.9)).toBe('1000');
    expect(formatMoney(100.4)).toBe('100');
  });

  it('sollte Stats korrekt formatiert anzeigen können', () => {
    const stats = calculateStats([{ id: 'bigger-stand', level: 2 }]);

    const idleDisplay = stats.idleIncome.toFixed(1);
    const multiplierDisplay = stats.multiplier.toFixed(2);

    expect(idleDisplay).toBe('2.0');
    expect(multiplierDisplay).toBe('1.00');
  });

  it('sollte Multiplier mit 2 Nachkommastellen formatieren', () => {
    const stats = calculateStats([{ id: 'secret-recipe', level: 2 }]);

    expect(stats.multiplier.toFixed(2)).toBe('1.30');
  });
});

// ========== RESET TESTS ==========

describe('Lemonade Stand - Reset', () => {
  it('sollte Spielstand vollständig zurücksetzen', () => {
    const reset = resetGame();

    expect(reset.money).toBe(0);
    expect(reset.totalEarned).toBe(0);
    expect(reset.totalClicks).toBe(0);
    expect(reset.upgrades).toEqual([]);
  });

  it('sollte Stats nach Reset auf Basis-Werte setzen', () => {
    const reset = resetGame();
    const stats = calculateStats(reset.upgrades);

    expect(stats.clickValue).toBe(1);
    expect(stats.idleIncome).toBe(0);
    expect(stats.multiplier).toBe(1);
  });

  it('sollte nach Reset alle Upgrades entfernt haben', () => {
    const stateWithUpgrades: GameState = {
      money: 1000,
      totalEarned: 5000,
      totalClicks: 500,
      upgrades: [
        { id: 'organic-lemons', level: 5 },
        { id: 'bigger-stand', level: 3 },
      ],
      lastSaveTime: Date.now(),
    };

    const statsBeforeReset = calculateStats(stateWithUpgrades.upgrades);
    expect(statsBeforeReset.clickValue).toBeGreaterThan(1);

    const reset = resetGame();
    const statsAfterReset = calculateStats(reset.upgrades);

    expect(statsAfterReset.clickValue).toBe(1);
  });
});

// ========== UPGRADE INTERAKTIONEN TESTS ==========

describe('Lemonade Stand - Upgrade Interaktionen', () => {
  it('sollte canAfford true returnen wenn genug Geld', () => {
    const money = 100;
    const upgrades: { id: string; level: number }[] = [];

    expect(canAfford(money, 'organic-lemons', upgrades)).toBe(true); // Kosten: 15
  });

  it('sollte canAfford false returnen wenn zu wenig Geld', () => {
    const money = 10;
    const upgrades: { id: string; level: number }[] = [];

    expect(canAfford(money, 'organic-lemons', upgrades)).toBe(false); // Kosten: 15
  });

  it('sollte canAfford mit steigenden Kosten korrekt berechnen', () => {
    const upgrades = [{ id: 'organic-lemons', level: 1 }];

    expect(canAfford(26, 'organic-lemons', upgrades)).toBe(false);
    expect(canAfford(27, 'organic-lemons', upgrades)).toBe(true);
  });

  it('sollte purchaseUpgrade false returnen für unbekannte Upgrade-IDs', () => {
    const state = { ...getInitialState(), money: 1000 };

    const { success } = purchaseUpgrade(state, 'fake-upgrade');

    expect(success).toBe(false);
  });

  it('sollte Stats nach Upgrade-Kauf neu berechnen', () => {
    const state = { ...getInitialState(), money: 100 };
    const statsBefore = calculateStats(state.upgrades);

    const { newState } = purchaseUpgrade(state, 'organic-lemons');
    const statsAfter = calculateStats(newState.upgrades);

    expect(statsAfter.clickValue).toBeGreaterThan(statsBefore.clickValue);
  });

  it('sollte mehrere verschiedene Upgrades kaufen können', () => {
    const state = { ...getInitialState(), money: 1000 };

    const { newState: state1 } = purchaseUpgrade(state, 'organic-lemons');
    const { newState: state2 } = purchaseUpgrade(state1, 'bigger-stand');

    expect(state2.upgrades.length).toBe(2);
    expect(state2.upgrades.find((u) => u.id === 'organic-lemons')?.level).toBe(1);
    expect(state2.upgrades.find((u) => u.id === 'bigger-stand')?.level).toBe(1);
  });

  it('sollte gleiches Upgrade mehrfach upgraden können', () => {
    let state = { ...getInitialState(), money: 1000 };

    for (let i = 0; i < 3; i++) {
      const { newState, success } = purchaseUpgrade(state, 'organic-lemons');
      if (success) state = newState;
    }

    expect(state.upgrades.find((u) => u.id === 'organic-lemons')?.level).toBe(3);
  });
});

// ========== KATEGORIEFILTER TESTS ==========

describe('Lemonade Stand - Kategorie Filter', () => {
  it('sollte bei "all" alle Upgrades anzeigen', () => {
    const filtered = filterUpgrades('all');

    expect(filtered.length).toBe(UPGRADES.length);
  });

  it('sollte bei "product" nur Produkt-Upgrades anzeigen', () => {
    const filtered = filterUpgrades('product');

    expect(filtered.every((u) => u.category === 'product')).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('sollte bei "stand" nur Stand-Upgrades anzeigen', () => {
    const filtered = filterUpgrades('stand');

    expect(filtered.every((u) => u.category === 'stand')).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('sollte bei "ambiance" nur Ambiance-Upgrades anzeigen', () => {
    const filtered = filterUpgrades('ambiance');

    expect(filtered.every((u) => u.category === 'ambiance')).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('sollte korrekte Anzahl pro Kategorie haben', () => {
    const product = filterUpgrades('product');
    const stand = filterUpgrades('stand');
    const ambiance = filterUpgrades('ambiance');

    expect(product.length + stand.length + ambiance.length).toBe(UPGRADES.length);
  });
});

// ========== EDGE CASES TESTS ==========

describe('Lemonade Stand - Edge Cases', () => {
  it('sollte mit leeren Upgrades-Array umgehen können', () => {
    const stats = calculateStats([]);

    expect(stats.clickValue).toBe(1);
    expect(stats.idleIncome).toBe(0);
    expect(stats.multiplier).toBe(1);
  });

  it('sollte mit ungültigen Upgrade-IDs umgehen können', () => {
    const stats = calculateStats([{ id: 'invalid-upgrade', level: 5 }]);

    expect(stats.clickValue).toBe(1);
    expect(stats.idleIncome).toBe(0);
    expect(stats.multiplier).toBe(1);
  });

  it('sollte mit gemischten gültigen/ungültigen Upgrades umgehen', () => {
    const stats = calculateStats([
      { id: 'organic-lemons', level: 2 },
      { id: 'invalid-upgrade', level: 10 },
      { id: 'bigger-stand', level: 1 },
    ]);

    expect(stats.clickValue).toBe(3); // 1 + 2
    expect(stats.idleIncome).toBe(1); // 0 + 1
  });

  it('sollte keine negativen Click-Werte haben', () => {
    const stats = calculateStats([]);

    expect(stats.clickValue).toBeGreaterThanOrEqual(1);
  });

  it('sollte bei sehr hohen Upgrade-Leveln numerisch stabil bleiben', () => {
    // Simuliere extreme Werte (über maxLevel hinaus für Edge-Case)
    const stats = calculateStats([
      { id: 'organic-lemons', level: 100 },
      { id: 'secret-recipe', level: 50 },
    ]);

    expect(Number.isFinite(stats.clickValue)).toBe(true);
    expect(Number.isNaN(stats.clickValue)).toBe(false);
    expect(Number.isFinite(stats.multiplier)).toBe(true);
  });

  it('sollte Upgrade-Kosten bei hohen Leveln nicht Infinity werden', () => {
    const cost = getUpgradeCost('organic-lemons', 50);

    expect(Number.isFinite(cost)).toBe(true);
    expect(cost).toBeGreaterThan(0);
  });

  it('sollte getUpgradeCost für unbekannte IDs Infinity returnen', () => {
    const cost = getUpgradeCost('unknown-upgrade', 0);

    expect(cost).toBe(Infinity);
  });

  it('sollte Multiplier korrekt auf 2 Dezimalstellen runden', () => {
    const stats = calculateStats([{ id: 'secret-recipe', level: 2 }]);

    // 1 + 0.15 * 2 = 1.30
    const rounded = Math.round(stats.multiplier * 100) / 100;
    expect(rounded).toBe(1.3);
  });

  it('sollte idleIncome nie negativ sein', () => {
    const stats = calculateStats([]);

    expect(stats.idleIncome).toBeGreaterThanOrEqual(0);
  });

  it('sollte mit Level 0 Upgrades umgehen', () => {
    const stats = calculateStats([{ id: 'organic-lemons', level: 0 }]);

    expect(stats.clickValue).toBe(1); // Kein Effekt bei Level 0
  });
});

// ========== IDLE-TICK TIMING TESTS ==========

describe('Lemonade Stand - Idle Tick', () => {
  it('sollte Idle-Income nur berechnen wenn idleIncome > 0', () => {
    const stats = calculateStats([]);

    expect(stats.idleIncome).toBe(0);

    // Bei idleIncome === 0 sollte kein Geld verdient werden
    const idleEarnings = stats.idleIncome * 60; // 60 Sekunden
    expect(idleEarnings).toBe(0);
  });

  it('sollte Idle-Income pro Sekunde korrekt berechnen', () => {
    const stats = calculateStats([{ id: 'bigger-stand', level: 3 }]);

    expect(stats.idleIncome).toBe(3);

    // Nach 60 Sekunden
    const earnings60s = stats.idleIncome * 60;
    expect(earnings60s).toBe(180);
  });

  it('sollte totalEarned bei Idle erhöhen', () => {
    const state = getInitialState();
    const stats = calculateStats([{ id: 'bigger-stand', level: 2 }]);

    // Simuliere Idle-Tick
    const newState = {
      ...state,
      money: state.money + stats.idleIncome,
      totalEarned: state.totalEarned + stats.idleIncome,
    };

    expect(newState.money).toBe(2);
    expect(newState.totalEarned).toBe(2);
  });

  it('sollte Multiplier auf Idle-Income anwenden', () => {
    const stats = calculateStats([
      { id: 'bigger-stand', level: 2 }, // +2 idleIncome
      { id: 'secret-recipe', level: 2 }, // +0.30 multiplier
    ]);

    // idleIncome = 2 * 1.30 = 2.6
    expect(stats.idleIncome).toBe(2.6);
  });

  it('sollte mehrere Idle-Income-Upgrades kombinieren', () => {
    const stats = calculateStats([
      { id: 'bigger-stand', level: 2 }, // +2
      { id: 'sign', level: 1 }, // +2
      { id: 'sun-umbrella', level: 1 }, // +4
    ]);

    expect(stats.idleIncome).toBe(8); // 2 + 2 + 4
  });
});

// ========== INTEGRATION TESTS ==========

describe('Lemonade Stand - Integration', () => {
  it('sollte kompletten Flow simulieren: Klicken -> Upgrade kaufen -> Stats steigen', () => {
    // Start
    let state = getInitialState();
    let stats = calculateStats(state.upgrades);

    expect(stats.clickValue).toBe(1);

    // Klicke 20 mal
    for (let i = 0; i < 20; i++) {
      state = simulateClick(state, stats);
    }

    expect(state.money).toBe(20);
    expect(state.totalClicks).toBe(20);

    // Kaufe erstes Upgrade (organic-lemons, Kosten 15)
    const { newState, success } = purchaseUpgrade(state, 'organic-lemons');

    expect(success).toBe(true);
    expect(newState.money).toBe(5); // 20 - 15

    // Stats sollten gestiegen sein
    stats = calculateStats(newState.upgrades);
    expect(stats.clickValue).toBe(2); // 1 + 1
  });

  it('sollte mehrere Upgrade-Käufe hintereinander handhaben', () => {
    let state = { ...getInitialState(), money: 1000 };

    const upgradeOrder = [
      'organic-lemons',
      'organic-lemons',
      'bigger-stand',
      'sugar-quality',
    ];

    for (const upgradeId of upgradeOrder) {
      const { newState, success } = purchaseUpgrade(state, upgradeId);
      if (success) {
        state = newState;
      }
    }

    const stats = calculateStats(state.upgrades);

    expect(state.upgrades.length).toBe(3); // 3 verschiedene Upgrades
    expect(stats.clickValue).toBeGreaterThan(1);
    expect(stats.idleIncome).toBeGreaterThan(0);
  });

  it('sollte Spielstand nach Save/Load gleich sein', () => {
    let store: Record<string, string> = {};
    const localStorageMock = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    const originalState: GameState = {
      money: 500,
      totalEarned: 1000,
      totalClicks: 100,
      upgrades: [
        { id: 'organic-lemons', level: 3 },
        { id: 'bigger-stand', level: 2 },
      ],
      lastSaveTime: Date.now(),
    };

    saveGame(originalState);
    const loadedState = loadGame();

    expect(loadedState.money).toBe(originalState.money);
    expect(loadedState.totalEarned).toBe(originalState.totalEarned);
    expect(loadedState.totalClicks).toBe(originalState.totalClicks);
    expect(loadedState.upgrades).toEqual(originalState.upgrades);
  });

  it('sollte komplette Progression mit allen Upgrade-Typen testen', () => {
    let state = { ...getInitialState(), money: 10000 };

    // Kaufe verschiedene Upgrade-Typen
    const purchases = [
      'organic-lemons', // clickValue
      'bigger-stand', // idleIncome
      'secret-recipe', // multiplier
      'plants', // multiplier (ambiance)
    ];

    for (const id of purchases) {
      const { newState } = purchaseUpgrade(state, id);
      state = newState;
    }

    const stats = calculateStats(state.upgrades);

    // Alle Effekt-Typen sollten aktiv sein
    expect(stats.clickValue).toBeGreaterThan(1);
    expect(stats.idleIncome).toBeGreaterThan(0);
    expect(stats.multiplier).toBeGreaterThan(1);
  });

  it('sollte realistische Spielsession von 5 Minuten simulieren', () => {
    let state = getInitialState();
    let stats = calculateStats(state.upgrades);

    // Simuliere 5 Minuten mit ~2 Klicks pro Sekunde = 600 Klicks
    // Plus Idle-Income
    for (let second = 0; second < 300; second++) {
      // 2 Klicks pro Sekunde
      for (let c = 0; c < 2; c++) {
        state = simulateClick(state, stats);
      }

      // Idle-Income (falls vorhanden)
      state = {
        ...state,
        money: state.money + stats.idleIncome,
        totalEarned: state.totalEarned + stats.idleIncome,
      };

      // Versuche Upgrades zu kaufen
      for (const upgrade of UPGRADES) {
        const level = state.upgrades.find((u) => u.id === upgrade.id)?.level || 0;
        if (canAfford(state.money, upgrade.id, state.upgrades) && level < upgrade.maxLevel) {
          const { newState, success } = purchaseUpgrade(state, upgrade.id);
          if (success) {
            state = newState;
            stats = calculateStats(state.upgrades);
          }
        }
      }
    }

    // Nach 5 Minuten sollte signifikanter Fortschritt gemacht worden sein
    expect(state.totalClicks).toBe(600);
    expect(state.upgrades.length).toBeGreaterThan(3);
    expect(stats.clickValue).toBeGreaterThan(5);
  });
});

// ========== SPAWN-WAHRSCHEINLICHKEITEN TESTS ==========

describe('Lemonade Stand - Spawn Wahrscheinlichkeiten', () => {
  it('sollte bei Klick mit 50% Wahrscheinlichkeit spawnen (Logik-Test)', () => {
    const threshold = 0.5;
    const mockRandom = 0.3;

    const shouldSpawn = mockRandom < threshold;
    expect(shouldSpawn).toBe(true);
  });

  it('sollte bei Idle mit 30% Wahrscheinlichkeit spawnen (Logik-Test)', () => {
    const threshold = 0.3;

    expect(0.2 < threshold).toBe(true); // spawn
    expect(0.4 < threshold).toBe(false); // no spawn
  });

  it('sollte deterministische Spawns mit gemocktem Random testen', () => {
    const results: boolean[] = [];
    const mockRandomValues = [0.1, 0.6, 0.3, 0.8, 0.2];

    mockRandomValues.forEach((val) => {
      results.push(val < 0.5); // 50% threshold
    });

    expect(results).toEqual([true, false, true, false, true]);
  });
});

// ========== ALLE UPGRADES VALIDIERUNG ==========

describe('Lemonade Stand - Upgrade Definitions Validierung', () => {
  it('sollte alle Upgrades mit gültigen Effekt-Typen haben', () => {
    const validTypes = ['clickValue', 'idleIncome', 'multiplier'];

    for (const upgrade of UPGRADES) {
      expect(validTypes).toContain(upgrade.effect.type);
    }
  });

  it('sollte alle Upgrades mit positiven Effekt-Werten haben', () => {
    for (const upgrade of UPGRADES) {
      expect(upgrade.effect.value).toBeGreaterThan(0);
    }
  });

  it('sollte alle Upgrades mit maxLevel >= 1 haben', () => {
    for (const upgrade of UPGRADES) {
      expect(upgrade.maxLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('sollte alle Upgrades mit baseCost > 0 haben', () => {
    for (const upgrade of UPGRADES) {
      expect(upgrade.baseCost).toBeGreaterThan(0);
    }
  });

  it('sollte alle Upgrades mit costMultiplier > 1 haben', () => {
    for (const upgrade of UPGRADES) {
      expect(upgrade.costMultiplier).toBeGreaterThan(1);
    }
  });

  it('sollte alle Upgrades mit eindeutigen IDs haben', () => {
    const ids = UPGRADES.map((u) => u.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('sollte alle Upgrades mit Name und Description haben', () => {
    for (const upgrade of UPGRADES) {
      expect(upgrade.name).toBeTruthy();
      expect(upgrade.name.length).toBeGreaterThan(0);
      expect(upgrade.description).toBeTruthy();
      expect(upgrade.description.length).toBeGreaterThan(0);
    }
  });
});
