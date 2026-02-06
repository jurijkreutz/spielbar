'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { readStorage, writeStorage } from '@/lib/safeStorage';
import {
  GameState,
  GameStats,
  Upgrade,
  UPGRADES,
  GAME_CONFIG,
  Customer,
  FloatingMoney,
} from '../types/lemonadestand';

const STORAGE_KEY = 'lemonade-stand-save';

function calculateStats(upgrades: Upgrade[]): GameStats {
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

function loadGame(): GameState {
  try {
    const saved = readStorage('local', STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        money: parsed.money || 0,
        totalEarned: parsed.totalEarned || 0,
        totalClicks: parsed.totalClicks || 0,
        upgrades: parsed.upgrades || [],
        lastSaveTime: parsed.lastSaveTime || Date.now(),
        gameStartTime: parsed.gameStartTime || Date.now(),
        totalPlayTime: parsed.totalPlayTime || 0,
        highriseReachedAt: parsed.highriseReachedAt ?? null,
        allMaxedAt: parsed.allMaxedAt ?? null,
      };
    }
  } catch {
    // Ignore invalid/missing storage
  }

  return getInitialState();
}

function getInitialState(): GameState {
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

function saveGame(state: GameState) {
  try {
    writeStorage('local', STORAGE_KEY, JSON.stringify({
      ...state,
      lastSaveTime: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

export function useLemonadeStand() {
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [stats, setStats] = useState<GameStats>({
    clickValue: 1,
    idleIncome: 0,
    multiplier: 1,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [floatingMoney, setFloatingMoney] = useState<FloatingMoney[]>([]);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const customerIdRef = useRef(0);
  const moneyIdRef = useRef(0);
  const sessionStartRef = useRef<number>(Date.now());

  // Load saved game on mount
  useEffect(() => {
    sessionStartRef.current = Date.now();
    const loaded = loadGame();
    setGameState(loaded);
    setStats(calculateStats(loaded.upgrades));

    // Calculate offline earnings
    const now = Date.now();
    const offlineMs = now - loaded.lastSaveTime;
    const offlineSeconds = Math.min(
      offlineMs / 1000,
      GAME_CONFIG.OFFLINE_INCOME_CAP_HOURS * 3600
    );

    const currentStats = calculateStats(loaded.upgrades);
    if (offlineSeconds > 60 && currentStats.idleIncome > 0) {
      const earnings = Math.floor(
        currentStats.idleIncome *
          offlineSeconds *
          GAME_CONFIG.OFFLINE_INCOME_EFFICIENCY
      );
      if (earnings > 0) {
        setOfflineEarnings(earnings);
        setGameState((prev) => ({
          ...prev,
          money: prev.money + earnings,
          totalEarned: prev.totalEarned + earnings,
        }));
      }
    }

    setIsLoaded(true);
  }, []);

  // Auto-save
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      saveGame(gameState);
    }, GAME_CONFIG.SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [gameState, isLoaded]);

  // Track play time
  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      const sessionTime = Date.now() - sessionStartRef.current;
      setGameState((prev) => ({
        ...prev,
        totalPlayTime: prev.totalPlayTime + 1000, // Add 1 second
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Idle income tick
  useEffect(() => {
    if (!isLoaded || stats.idleIncome <= 0) return;

    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        money: prev.money + stats.idleIncome,
        totalEarned: prev.totalEarned + stats.idleIncome,
      }));

      // Occasionally spawn a customer for idle income
      if (Math.random() < 0.3) {
        spawnCustomer();
      }
    }, GAME_CONFIG.IDLE_TICK_MS);

    return () => clearInterval(interval);
  }, [stats.idleIncome, isLoaded]);

  // Clean up floating money
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingMoney((prev) =>
        prev
          .map((m) => ({
            ...m,
            y: m.y - 1.5,
            opacity: m.opacity - 0.03,
          }))
          .filter((m) => m.opacity > 0)
      );

      setCustomers((prev) =>
        prev
          .map((c) => ({
            ...c,
            x: c.leaving ? c.x + 2 : c.x,
            opacity: c.leaving ? c.opacity - 0.02 : Math.min(c.opacity + 0.05, 1),
          }))
          .filter((c) => c.opacity > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const spawnCustomer = useCallback(() => {
    const newCustomer: Customer = {
      id: customerIdRef.current++,
      x: -30,
      y: 180 + Math.random() * 40,
      opacity: 0,
      leaving: false,
    };

    setCustomers((prev) => {
      // Limit customers
      if (prev.length >= 5) return prev;
      return [...prev, newCustomer];
    });

    // Customer leaves after a delay
    setTimeout(() => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === newCustomer.id ? { ...c, leaving: true } : c))
      );
    }, 2000 + Math.random() * 2000);
  }, []);

  const handleClick = useCallback(
    (clientX?: number, clientY?: number) => {
      const earnings = stats.clickValue;

      setGameState((prev) => ({
        ...prev,
        money: prev.money + earnings,
        totalEarned: prev.totalEarned + earnings,
        totalClicks: prev.totalClicks + 1,
      }));

      // Add floating money at click position or random
      const x = clientX !== undefined ? clientX : 100 + Math.random() * 100;
      const y = clientY !== undefined ? clientY : 100 + Math.random() * 50;

      const newMoney: FloatingMoney = {
        id: moneyIdRef.current++,
        x,
        y,
        amount: earnings,
        opacity: 1,
      };
      setFloatingMoney((prev) => [...prev.slice(-10), newMoney]);

      // Spawn customer on click
      if (Math.random() < 0.5) {
        spawnCustomer();
      }
    },
    [stats.clickValue, spawnCustomer]
  );

  const purchaseUpgrade = useCallback(
    (upgradeId: string) => {
      const def = UPGRADES.find((u) => u.id === upgradeId);
      if (!def) return false;

      const currentUpgrade = gameState.upgrades.find((u) => u.id === upgradeId);
      const currentLevel = currentUpgrade?.level || 0;

      if (currentLevel >= def.maxLevel) return false;

      const cost = getUpgradeCost(upgradeId, currentLevel);
      if (gameState.money < cost) return false;

      setGameState((prev) => {
        const newUpgrades = [...prev.upgrades];
        const existingIndex = newUpgrades.findIndex((u) => u.id === upgradeId);

        if (existingIndex >= 0) {
          newUpgrades[existingIndex] = {
            ...newUpgrades[existingIndex],
            level: newUpgrades[existingIndex].level + 1,
          };
        } else {
          newUpgrades.push({ id: upgradeId, level: 1 });
        }

        const newState = {
          ...prev,
          money: prev.money - cost,
          upgrades: newUpgrades,
        };

        // Recalculate stats
        setStats(calculateStats(newUpgrades));

        return newState;
      });

      return true;
    },
    [gameState.money, gameState.upgrades]
  );

  const getUpgradeLevel = useCallback(
    (upgradeId: string): number => {
      const upgrade = gameState.upgrades.find((u) => u.id === upgradeId);
      return upgrade?.level || 0;
    },
    [gameState.upgrades]
  );

  const canAfford = useCallback(
    (upgradeId: string): boolean => {
      const level = getUpgradeLevel(upgradeId);
      const cost = getUpgradeCost(upgradeId, level);
      return gameState.money >= cost;
    },
    [gameState.money, getUpgradeLevel]
  );

  const dismissOfflineEarnings = useCallback(() => {
    setOfflineEarnings(null);
  }, []);

  const resetGame = useCallback(() => {
    const initial = getInitialState();
    setGameState(initial);
    setStats(calculateStats([]));
    saveGame(initial);
  }, []);

  return {
    gameState,
    stats,
    customers,
    floatingMoney,
    offlineEarnings,
    isLoaded,
    handleClick,
    purchaseUpgrade,
    getUpgradeLevel,
    getUpgradeCost,
    canAfford,
    dismissOfflineEarnings,
    resetGame,
  };
}
