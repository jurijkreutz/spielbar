// Lemonade Stand Game Types

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'stand' | 'ambiance';
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effect: {
    type: 'clickValue' | 'idleIncome' | 'multiplier';
    value: number;
  };
  icon: string;
}

export interface Upgrade {
  id: string;
  level: number;
}

export interface Customer {
  id: number;
  x: number;
  y: number;
  opacity: number;
  leaving: boolean;
}

export interface FloatingMoney {
  id: number;
  x: number;
  y: number;
  amount: number;
  opacity: number;
}

export interface Lemon {
  id: number;
  x: number;
  y: number;
  rotation: number;
  wobblePhase: number;
}

export interface GameState {
  money: number;
  totalEarned: number;
  totalClicks: number;
  upgrades: Upgrade[];
  lastSaveTime: number;
  // Lifetime tracking
  gameStartTime: number; // When the game was first started
  totalPlayTime: number; // Total time played in ms
  highriseReachedAt: number | null; // When highrise was reached
  allMaxedAt: number | null; // When all upgrades were maxed
}

// Achievement definitions
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Achievement {
  id: string;
  unlockedAt: number; // Timestamp when unlocked
}

export interface AchievementsState {
  achievements: Achievement[];
  records: {
    timeToHighrise: number | null; // ms from game start
    timeToAllMaxed: number | null; // ms from game start
    lifetimeEarnings: number;
    lifetimeClicks: number;
    totalPlayTime: number;
  };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-sip',
    name: 'First Sip',
    description: 'Erste Limonade verkauft',
    icon: '🍋',
  },
  {
    id: 'sweet-profit',
    name: 'Sweet Profit',
    description: '$10.000 Gesamtumsatz erreicht',
    icon: '💰',
  },
  {
    id: 'real-business',
    name: 'Real Business',
    description: 'Lemonade-Haus freigeschaltet',
    icon: '🏪',
  },
  {
    id: 'lemonade-empire',
    name: 'Lemonade Empire',
    description: 'Lemonade-Hochhaus freigeschaltet',
    icon: '🏙️',
  },
  {
    id: 'lemonade-tycoon',
    name: 'Lemonade Tycoon',
    description: 'Alle Upgrades auf Maximalstufe',
    icon: '👑',
  },
];

export interface GameStats {
  clickValue: number;
  idleIncome: number;
  multiplier: number;
}

// Upgrade-Definitionen
export const UPGRADES: UpgradeDefinition[] = [
  // Product Upgrades
  {
    id: 'organic-lemons',
    name: 'Bio-Zitronen',
    description: 'Frischer, saftiger, teurer',
    category: 'product',
    baseCost: 15,
    costMultiplier: 1.8,
    maxLevel: 10,
    effect: { type: 'clickValue', value: 1 },
    icon: '🍋',
  },
  {
    id: 'sugar-quality',
    name: 'Premium Zucker',
    description: 'Das gewisse Süße',
    category: 'product',
    baseCost: 50,
    costMultiplier: 2.0,
    maxLevel: 10,
    effect: { type: 'clickValue', value: 2 },
    icon: '🍬',
  },
  {
    id: 'ice-cubes',
    name: 'Eiswürfel',
    description: 'Erfrischend kalt!',
    category: 'product',
    baseCost: 100,
    costMultiplier: 2.2,
    maxLevel: 10,
    effect: { type: 'clickValue', value: 3 },
    icon: '🧊',
  },
  {
    id: 'secret-recipe',
    name: 'Geheimrezept',
    description: 'Omas beste Mischung',
    category: 'product',
    baseCost: 500,
    costMultiplier: 2.5,
    maxLevel: 5,
    effect: { type: 'multiplier', value: 0.15 },
    icon: '📜',
  },

  // Stand Upgrades
  {
    id: 'bigger-stand',
    name: 'Größerer Stand',
    description: 'Mehr Platz, mehr Kunden',
    category: 'stand',
    baseCost: 75,
    costMultiplier: 2.0,
    maxLevel: 5,
    effect: { type: 'idleIncome', value: 1 },
    icon: '🏪',
  },
  {
    id: 'sign',
    name: 'Werbeschild',
    description: 'Lockt Passanten an',
    category: 'stand',
    baseCost: 150,
    costMultiplier: 2.2,
    maxLevel: 5,
    effect: { type: 'idleIncome', value: 2 },
    icon: '📢',
  },
  {
    id: 'sun-umbrella',
    name: 'Sonnenschirm',
    description: 'Schatten = mehr Kunden',
    category: 'stand',
    baseCost: 300,
    costMultiplier: 2.3,
    maxLevel: 5,
    effect: { type: 'idleIncome', value: 4 },
    icon: '⛱️',
  },
  {
    id: 'dispenser',
    name: 'Zapfanlage',
    description: 'Schneller servieren',
    category: 'stand',
    baseCost: 800,
    costMultiplier: 2.5,
    maxLevel: 5,
    effect: { type: 'multiplier', value: 0.2 },
    icon: '🚰',
  },

  // Ambiance Upgrades
  {
    id: 'bench',
    name: 'Sitzbank',
    description: 'Kunden bleiben länger',
    category: 'ambiance',
    baseCost: 200,
    costMultiplier: 2.0,
    maxLevel: 3,
    effect: { type: 'idleIncome', value: 3 },
    icon: '/games/lemonadestand/bench.png',
  },
  {
    id: 'plants',
    name: 'Pflanzen',
    description: 'Gemütliche Atmosphäre',
    category: 'ambiance',
    baseCost: 350,
    costMultiplier: 2.2,
    maxLevel: 3,
    effect: { type: 'multiplier', value: 0.1 },
    icon: '/games/lemonadestand/plants.png',
  },
  {
    id: 'music-box',
    name: 'Musikbox',
    description: 'Sommerhits locken an',
    category: 'ambiance',
    baseCost: 600,
    costMultiplier: 2.5,
    maxLevel: 3,
    effect: { type: 'idleIncome', value: 6 },
    icon: '/games/lemonadestand/musicbox.png',
  },
  {
    id: 'fairy-lights',
    name: 'Lichterkette',
    description: 'Magische Abendstimmung',
    category: 'ambiance',
    baseCost: 1000,
    costMultiplier: 2.8,
    maxLevel: 3,
    effect: { type: 'multiplier', value: 0.25 },
    icon: '/games/lemonadestand/fairylights.png',
  },
];

// Game Configuration
export const GAME_CONFIG = {
  BASE_CLICK_VALUE: 1,
  BASE_IDLE_INCOME: 0,
  IDLE_TICK_MS: 1000,
  SAVE_INTERVAL_MS: 5000,
  OFFLINE_INCOME_CAP_HOURS: 8,
  OFFLINE_INCOME_EFFICIENCY: 0.5,
};
