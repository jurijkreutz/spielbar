// Snake Game Types & Configuration

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment extends Position {
  // For smooth rendering
  prevX?: number;
  prevY?: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type SpecialItemType = 'slow' | 'ghost' | 'double' | 'shrink';

export interface SpecialItem {
  type: SpecialItemType;
  position: Position;
  spawnTime: number;
  duration: number; // How long it stays on the field
}

export interface ActiveEffect {
  type: SpecialItemType;
  endTime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Risk Zone - temporäre High Risk / High Reward Bereiche
export interface RiskZone {
  x: number; // Top-left grid position
  y: number;
  width: number; // Size in grid cells
  height: number;
  spawnTime: number;
  duration: number;
  pointsMultiplier: number; // Bonus for eating food in zone
  comboBoost: number; // Extra combo points
}

// Camera state for Flow Camera feature
export interface CameraState {
  zoom: number; // Current zoom level (1.0 = normal)
  targetZoom: number; // Target zoom level for smooth transitions
  offsetX: number; // Camera offset X
  offsetY: number; // Camera offset Y
  shake: number; // Screen shake intensity
  intensity: number; // Overall visual intensity (0-1)
  nearMissTimer: number; // Timer for near-miss effect
}

export interface GameState {
  status: GameStatus;
  snake: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  food: Position;
  specialItem: SpecialItem | null;
  activeEffects: ActiveEffect[];
  score: number;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  speed: number;
  maxSpeed: number;
  maxLength: number;
  startTime: number;
  survivalTime: number;
  particles: Particle[];
  showComboText: boolean;
  lastFoodTime: number;
  // Signature Features
  riskZone: RiskZone | null;
  cameraState: CameraState;
  riskZoneScore: number; // Points earned in risk zones
  inRiskZone: boolean; // True if player has entered risk zone (can't leave once entered!)
}

export interface HighScores {
  best: number;
  lastScore: number;
  bestCombo: number;
  bestLength: number;
  bestTime: number;
}

export interface RunStats {
  score: number;
  survivalTime: number;
  maxLength: number;
  maxSpeed: number;
  maxCombo: number;
  riskZoneScore: number; // Points earned in risk zones
}

// Game Configuration
export const GAME_CONFIG = {
  // Grid settings
  GRID_SIZE: 20,
  CELL_SIZE: 20,

  // Canvas dimensions
  get CANVAS_WIDTH() {
    return this.GRID_SIZE * this.CELL_SIZE;
  },
  get CANVAS_HEIGHT() {
    return this.GRID_SIZE * this.CELL_SIZE;
  },

  // Speed settings (ms per move)
  INITIAL_SPEED: 150,
  MIN_SPEED: 60, // Fastest
  SPEED_DECREASE: 2, // How much faster per food

  // Combo settings
  COMBO_WINDOW: 2000, // ms to keep combo alive
  COMBO_MULTIPLIER: 0.5, // Points per combo level

  // Special items
  SPECIAL_SPAWN_CHANCE: 0.15, // 15% chance after eating
  SPECIAL_DURATION: 8000, // How long special stays on field
  EFFECT_DURATION: 5000, // How long effect lasts

  // Effects
  SLOW_MULTIPLIER: 1.5, // Speed multiplier (higher = slower)
  DOUBLE_POINTS: 2,
  SHRINK_AMOUNT: 3, // Segments to remove

  // Risk Zone settings
  RISK_ZONE_SPAWN_CHANCE: 0.25, // 25% chance after eating food
  RISK_ZONE_MIN_SIZE: 4, // Minimum zone size
  RISK_ZONE_MAX_SIZE: 6, // Maximum zone size
  RISK_ZONE_DURATION: 10000, // How long risk zone stays (ms)
  RISK_ZONE_POINTS_MULTIPLIER: 3, // 3x points in risk zone
  RISK_ZONE_COMBO_BOOST: 2, // Extra combo in risk zone
  RISK_ZONE_SPEED_BOOST: 0.8, // Speed multiplier in risk zone (faster!)

  // Flow Camera settings
  CAMERA_ZOOM_MIN: 1.0, // Normal zoom
  CAMERA_ZOOM_SPEED_MAX: 0.92, // Zoom out at max speed
  CAMERA_ZOOM_RISK: 1.05, // Slight zoom in for risk zones
  CAMERA_SMOOTH_FACTOR: 0.08, // How fast camera adjusts
  CAMERA_NEAR_MISS_DISTANCE: 1, // Grid cells for near-miss detection
  CAMERA_NEAR_MISS_DURATION: 300, // ms for near-miss effect
  CAMERA_SHAKE_DECAY: 0.9, // How fast shake reduces
};

// Color Palette - Modern, clean, slightly futuristic
export const COLORS = {
  // Background
  BG_DARK: '#0a0a0f',
  BG_GRID: '#12121a',
  GRID_LINE: 'rgba(255, 255, 255, 0.03)',

  // Snake - Gradient from head to tail
  SNAKE_HEAD: '#00ff88',
  SNAKE_BODY: '#00cc6a',
  SNAKE_TAIL: '#00994d',
  SNAKE_GLOW: 'rgba(0, 255, 136, 0.4)',
  SNAKE_GHOST: 'rgba(0, 255, 136, 0.3)',

  // Food
  FOOD_PRIMARY: '#ff3366',
  FOOD_GLOW: 'rgba(255, 51, 102, 0.5)',

  // Special Items
  SPECIAL_SLOW: '#4da6ff',
  SPECIAL_GHOST: '#b366ff',
  SPECIAL_DOUBLE: '#ffcc00',
  SPECIAL_SHRINK: '#ff6b35',

  // UI
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.6)',
  TEXT_ACCENT: '#00ff88',

  // Effects
  COMBO_TEXT: '#ffcc00',
  PERFECT_GLOW: '#ffffff',

  // Risk Zone
  RISK_ZONE_BG: 'rgba(255, 51, 102, 0.08)',
  RISK_ZONE_BORDER: 'rgba(255, 51, 102, 0.4)',
  RISK_ZONE_GLOW: 'rgba(255, 51, 102, 0.2)',
  RISK_ZONE_PULSE: 'rgba(255, 51, 102, 0.15)',
};

// Special Item Descriptions
export const SPECIAL_ITEMS: Record<SpecialItemType, { name: string; color: string; icon: string }> = {
  slow: { name: 'Slow Motion', color: COLORS.SPECIAL_SLOW, icon: '⏱' },
  ghost: { name: 'Ghost Mode', color: COLORS.SPECIAL_GHOST, icon: '👻' },
  double: { name: 'Double Points', color: COLORS.SPECIAL_DOUBLE, icon: '✨' },
  shrink: { name: 'Shrink', color: COLORS.SPECIAL_SHRINK, icon: '📏' },
};

