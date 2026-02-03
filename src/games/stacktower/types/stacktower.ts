// filepath: /Users/jkreutz/jurij/minesweeper/src/types/stacktower.ts

export interface Block {
  x: number;
  width: number;
  y: number;
  color: string;
  perfect?: boolean;
}

export interface FallingPiece {
  x: number;
  width: number;
  y: number;
  velocityY: number;
  color: string;
  side: 'left' | 'right';
}

export interface GameState {
  status: 'idle' | 'playing' | 'gameover';
  score: number;
  blocks: Block[];
  currentBlock: {
    x: number;
    width: number;
    direction: 1 | -1;
    speed: number;
  } | null;
  fallingPieces: FallingPiece[];
  perfectStreak: number;
  showPerfect: boolean;
}

export interface HighScores {
  best: number;
  lastScore: number;
}

// Farbpalette für den Himmel-Gradient basierend auf Höhe
// Je höher, desto heller und luftiger
export const SKY_COLORS = [
  { stop: 0, color: '#87CEEB' },    // Klassisches Himmelblau (Boden)
  { stop: 15, color: '#8ED3F0' },
  { stop: 30, color: '#96D8F5' },
  { stop: 50, color: '#A0DEFA' },
  { stop: 75, color: '#B0E5FC' },
  { stop: 100, color: '#C5EDFF' },  // Sehr hell und luftig
  { stop: 150, color: '#D8F3FF' },
  { stop: 200, color: '#E8F8FF' },  // Fast weiß - offener Himmel
];

// Block-Farbpalette (warme, befriedigende Farben)
export const BLOCK_COLORS = [
  '#FF6B6B', // Coral Red
  '#FF8E72', // Salmon
  '#FFA07A', // Light Salmon
  '#FFB366', // Sandy Orange
  '#FFC857', // Saffron
  '#FFD93D', // Sunflower
  '#C9E265', // Yellow Green
  '#6BCB77', // Emerald
  '#4ECDC4', // Tiffany Blue
  '#45B7D1', // Sky Blue
  '#5E9FE0', // Cornflower
  '#7B68EE', // Medium Slate Blue
  '#9B59B6', // Amethyst
  '#E056FD', // Heliotrope
  '#FF6B9D', // Hot Pink
];

// Spiel-Konstanten
export const GAME_CONFIG = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  INITIAL_BLOCK_WIDTH: 200,
  BLOCK_HEIGHT: 20,
  INITIAL_SPEED: 2,
  SPEED_INCREMENT: 0.05,
  MAX_SPEED: 8,
  PERFECT_THRESHOLD: 5, // Pixel Toleranz für "Perfect"
  GRAVITY: 0.5,
  BASE_Y: 550, // Basis-Y für den ersten Block
};

