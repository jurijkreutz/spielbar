'use client';

import { useState, useEffect, useCallback } from 'react';
import { readStorage, writeStorage } from '@/lib/safeStorage';
import {
  AchievementsState,
  Achievement,
  ACHIEVEMENTS,
  UPGRADES,
  Upgrade,
} from '../types/lemonadestand';

const ACHIEVEMENTS_STORAGE_KEY = 'lemonade-stand-achievements';

function getInitialState(): AchievementsState {
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

function loadAchievements(): AchievementsState {
  try {
    const saved = readStorage('local', ACHIEVEMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        achievements: parsed.achievements || [],
        records: {
          timeToHighrise: parsed.records?.timeToHighrise ?? null,
          timeToAllMaxed: parsed.records?.timeToAllMaxed ?? null,
          lifetimeEarnings: parsed.records?.lifetimeEarnings || 0,
          lifetimeClicks: parsed.records?.lifetimeClicks || 0,
          totalPlayTime: parsed.records?.totalPlayTime || 0,
        },
      };
    }
  } catch {
    // Ignore invalid/missing storage
  }

  return getInitialState();
}

function saveAchievements(state: AchievementsState) {
  try {
    writeStorage('local', ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useAchievements() {
  const [state, setState] = useState<AchievementsState>(() => loadAchievements());
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Set loaded on mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Save on state change
  useEffect(() => {
    if (!isLoaded) return;
    saveAchievements(state);
  }, [state, isLoaded]);

  const isUnlocked = useCallback(
    (achievementId: string): boolean => {
      return state.achievements.some((a) => a.id === achievementId);
    },
    [state.achievements]
  );

  const unlockAchievement = useCallback(
    (achievementId: string) => {
      if (isUnlocked(achievementId)) return;

      const achievement: Achievement = {
        id: achievementId,
        unlockedAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        achievements: [...prev.achievements, achievement],
      }));

      // Show notification
      setNewlyUnlocked(achievementId);
    },
    [isUnlocked]
  );

  const dismissNotification = useCallback(() => {
    setNewlyUnlocked(null);
  }, []);

  const updateRecords = useCallback(
    (data: {
      totalEarned: number;
      totalClicks: number;
      totalPlayTime: number;
      timeToHighrise?: number | null;
      timeToAllMaxed?: number | null;
    }) => {
      setState((prev) => ({
        ...prev,
        records: {
          ...prev.records,
          lifetimeEarnings: Math.max(prev.records.lifetimeEarnings, data.totalEarned),
          lifetimeClicks: Math.max(prev.records.lifetimeClicks, data.totalClicks),
          totalPlayTime: Math.max(prev.records.totalPlayTime, data.totalPlayTime),
          // Only update time records if they haven't been set
          timeToHighrise:
            data.timeToHighrise !== undefined && prev.records.timeToHighrise === null
              ? data.timeToHighrise
              : prev.records.timeToHighrise,
          timeToAllMaxed:
            data.timeToAllMaxed !== undefined && prev.records.timeToAllMaxed === null
              ? data.timeToAllMaxed
              : prev.records.timeToAllMaxed,
        },
      }));
    },
    []
  );

  // Check achievements based on game state
  const checkAchievements = useCallback(
    (gameData: {
      totalClicks: number;
      totalEarned: number;
      upgrades: Upgrade[];
      totalPlayTime: number;
    }) => {
      // First Sip - First lemonade sold
      if (gameData.totalClicks >= 1) {
        unlockAchievement('first-sip');
      }

      // Sweet Profit - $10,000 total earnings
      if (gameData.totalEarned >= 10000) {
        unlockAchievement('sweet-profit');
      }

      // Get stand level for Real Business and Lemonade Empire
      const standUpgrade = gameData.upgrades.find((u) => u.id === 'bigger-stand');
      const standLevel = standUpgrade?.level || 0;

      // Real Business - Lemonade house unlocked (stand level 4)
      if (standLevel >= 4) {
        unlockAchievement('real-business');
      }

      // Lemonade Empire - Highrise unlocked (stand level 5)
      if (standLevel >= 5) {
        unlockAchievement('lemonade-empire');
      }

      // Lemonade Tycoon - All upgrades maxed
      const allMaxed = UPGRADES.every((def) => {
        const upgrade = gameData.upgrades.find((u) => u.id === def.id);
        return upgrade && upgrade.level >= def.maxLevel;
      });

      if (allMaxed) {
        unlockAchievement('lemonade-tycoon');
      }

      // Update records
      updateRecords({
        totalEarned: gameData.totalEarned,
        totalClicks: gameData.totalClicks,
        totalPlayTime: gameData.totalPlayTime,
        timeToHighrise: standLevel >= 5 && !state.records.timeToHighrise ? gameData.totalPlayTime : undefined,
        timeToAllMaxed: allMaxed && !state.records.timeToAllMaxed ? gameData.totalPlayTime : undefined,
      });
    },
    [unlockAchievement, updateRecords, state.records.timeToHighrise, state.records.timeToAllMaxed]
  );

  const resetAchievements = useCallback(() => {
    const initial = getInitialState();
    setState(initial);
    saveAchievements(initial);
  }, []);

  return {
    achievements: state.achievements,
    records: state.records,
    isUnlocked,
    checkAchievements,
    newlyUnlocked,
    dismissNotification,
    isLoaded,
    resetAchievements,
  };
}

// Helper to get achievement definition
export function getAchievementDef(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
