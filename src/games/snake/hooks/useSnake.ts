'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  GameState,
  Direction,
  Position,
  SnakeSegment,
  HighScores,
  RunStats,
  SpecialItemType,
  Particle,
  RiskZone,
  CameraState,
} from '../types/snake';
import { GAME_CONFIG, COLORS } from '../types/snake';

const STORAGE_KEY = 'snake-highscores';

// Helper to load high scores from localStorage
function loadHighScores(): HighScores {
  if (typeof window === 'undefined') return { best: 0, lastScore: 0, bestCombo: 0, bestLength: 0, bestTime: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { best: 0, lastScore: 0, bestCombo: 0, bestLength: 0, bestTime: 0 };
  } catch {
    return { best: 0, lastScore: 0, bestCombo: 0, bestLength: 0, bestTime: 0 };
  }
}

// Helper to save high scores
function saveHighScores(scores: HighScores): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Ignore storage errors
  }
}

// Get opposite direction (to prevent 180° turns)
function getOpposite(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  return opposites[dir];
}

// Generate random position on grid
function randomPosition(exclude: Position[] = []): Position {
  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE),
      y: Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE),
    };
    attempts++;
  } while (exclude.some((p) => p.x === pos.x && p.y === pos.y) && attempts < 100);
  return pos;
}

// Generate random special item type
function randomSpecialType(): SpecialItemType {
  const types: SpecialItemType[] = ['slow', 'ghost', 'double', 'shrink'];
  return types[Math.floor(Math.random() * types.length)];
}

// Generate random risk zone
function generateRiskZone(): RiskZone {
  const width = GAME_CONFIG.RISK_ZONE_MIN_SIZE +
    Math.floor(Math.random() * (GAME_CONFIG.RISK_ZONE_MAX_SIZE - GAME_CONFIG.RISK_ZONE_MIN_SIZE + 1));
  const height = GAME_CONFIG.RISK_ZONE_MIN_SIZE +
    Math.floor(Math.random() * (GAME_CONFIG.RISK_ZONE_MAX_SIZE - GAME_CONFIG.RISK_ZONE_MIN_SIZE + 1));

  // Position zone away from edges but could be corners or center
  const x = Math.floor(Math.random() * (GAME_CONFIG.GRID_SIZE - width));
  const y = Math.floor(Math.random() * (GAME_CONFIG.GRID_SIZE - height));

  return {
    x,
    y,
    width,
    height,
    spawnTime: Date.now(),
    duration: GAME_CONFIG.RISK_ZONE_DURATION,
    pointsMultiplier: GAME_CONFIG.RISK_ZONE_POINTS_MULTIPLIER,
    comboBoost: GAME_CONFIG.RISK_ZONE_COMBO_BOOST,
  };
}

// Check if position is inside risk zone
function isInRiskZone(pos: Position, zone: RiskZone | null): boolean {
  if (!zone) return false;
  return pos.x >= zone.x && pos.x < zone.x + zone.width &&
         pos.y >= zone.y && pos.y < zone.y + zone.height;
}

// Detect near-miss situations (snake head close to walls or body)
function detectNearMiss(head: Position, snake: SnakeSegment[], isGhost: boolean): boolean {
  const threshold = GAME_CONFIG.CAMERA_NEAR_MISS_DISTANCE;

  // Near wall check
  if (head.x <= threshold || head.x >= GAME_CONFIG.GRID_SIZE - 1 - threshold ||
      head.y <= threshold || head.y >= GAME_CONFIG.GRID_SIZE - 1 - threshold) {
    return true;
  }

  // Near body check (skip if ghost mode)
  if (!isGhost) {
    for (let i = 3; i < snake.length; i++) { // Start from 3 to avoid false positives
      const dx = Math.abs(head.x - snake[i].x);
      const dy = Math.abs(head.y - snake[i].y);
      if (dx <= threshold && dy <= threshold && !(dx === 0 && dy === 0)) {
        return true;
      }
    }
  }

  return false;
}

// Create initial camera state
function createInitialCameraState(): CameraState {
  return {
    zoom: 1.0,
    targetZoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    shake: 0,
    intensity: 0,
    nearMissTimer: 0,
  };
}

// Create particles for visual feedback
function createParticles(x: number, y: number, color: string, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
      y: y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
}

// Initial game state
function createInitialState(): GameState {
  const centerX = Math.floor(GAME_CONFIG.GRID_SIZE / 2);
  const centerY = Math.floor(GAME_CONFIG.GRID_SIZE / 2);

  const initialSnake: SnakeSegment[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  return {
    status: 'idle',
    snake: initialSnake,
    direction: 'right',
    nextDirection: 'right',
    food: randomPosition(initialSnake),
    specialItem: null,
    activeEffects: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    speed: GAME_CONFIG.INITIAL_SPEED,
    maxSpeed: GAME_CONFIG.INITIAL_SPEED,
    maxLength: 3,
    startTime: 0,
    survivalTime: 0,
    particles: [],
    showComboText: false,
    lastFoodTime: 0,
    // Signature Features
    riskZone: null,
    cameraState: createInitialCameraState(),
    riskZoneScore: 0,
    inRiskZone: false,
  };
}

export function useSnake() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [highScores, setHighScores] = useState<HighScores>({ best: 0, lastScore: 0, bestCombo: 0, bestLength: 0, bestTime: 0 });
  const [lastRunStats, setLastRunStats] = useState<RunStats | null>(null);

  const inputQueueRef = useRef<Direction[]>([]);
  const currentDirectionRef = useRef<Direction>('right');

  // Load high scores on mount
  useEffect(() => {
    setHighScores(loadHighScores());
  }, []);

  // Check for active effects
  const hasEffect = useCallback((type: SpecialItemType): boolean => {
    return gameState.activeEffects.some((e) => e.type === type);
  }, [gameState.activeEffects]);

  // Get current effective speed
  const getEffectiveSpeed = useCallback((): number => {
    let speed = gameState.speed;
    if (hasEffect('slow')) {
      speed *= GAME_CONFIG.SLOW_MULTIPLIER;
    }
    return speed;
  }, [gameState.speed, hasEffect]);

  // Start a new game
  const startGame = useCallback(() => {
    inputQueueRef.current = [];
    currentDirectionRef.current = 'right';

    const newState = createInitialState();
    newState.status = 'playing';
    newState.startTime = Date.now();
    newState.lastFoodTime = Date.now();

    setGameState(newState);
    setLastRunStats(null);
  }, []);

  // Change direction (apply immediately + keep small queue for ultra-fast double taps)
  const changeDirection = useCallback((newDir: Direction) => {
    setGameState((prev) => {
      // only accept input while actively playing
      if (prev.status !== 'playing') return prev;

      const effectiveDir =
        inputQueueRef.current.length > 0
          ? inputQueueRef.current[inputQueueRef.current.length - 1]
          : currentDirectionRef.current;

      // prevent 180° turns
      if (newDir === getOpposite(effectiveDir)) {
        return prev;
      }

      // If direction actually changes, apply it immediately so the next tick reflects it.
      // Also reset the queue to avoid "stale" inputs fighting the new direction.
      inputQueueRef.current = [];
      currentDirectionRef.current = newDir;

      return {
        ...prev,
        direction: newDir,
      };
    });
  }, []);

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev.status === 'playing') {
        inputQueueRef.current = [];
        return { ...prev, status: 'paused' };
      } else if (prev.status === 'paused') {
        return { ...prev, status: 'playing' };
      }
      return prev;
    });
  }, []);

  // Game tick - moves the snake one step
  const gameTick = useCallback(() => {
    setGameState((prev) => {
      if (prev.status !== 'playing') {
        return prev;
      }

      const now = Date.now();

      // Update particles
      let particles = prev.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // gravity
          life: p.life - 0.02,
        }))
        .filter((p) => p.life > 0);

      // Update combo timer
      let combo = prev.combo;
      let showComboText = prev.showComboText;
      if (combo > 0 && now - prev.comboTimer > GAME_CONFIG.COMBO_WINDOW) {
        combo = 0;
        showComboText = false;
      }

      // Remove expired effects
      const activeEffects = prev.activeEffects.filter((e) => now < e.endTime);

      // Remove expired special item
      let specialItem = prev.specialItem;
      if (specialItem && now - specialItem.spawnTime > specialItem.duration) {
        specialItem = null;
      }

      // Remove expired risk zone
      let riskZone = prev.riskZone;
      if (riskZone && now - riskZone.spawnTime > riskZone.duration) {
        riskZone = null;
      }

      // Start from the direction stored in state (source of truth)
      let direction: Direction = prev.direction;

      // Apply next queued direction (if any)
      if (inputQueueRef.current.length > 0) {
        const queued = inputQueueRef.current.shift()!;
        if (queued !== getOpposite(direction)) {
          direction = queued;
        }
      }

      currentDirectionRef.current = direction;

      // Calculate new head position
      const head = prev.snake[0];
      let newHead: SnakeSegment = { ...head };

      switch (direction) {
        case 'up':
          newHead = { x: head.x, y: head.y - 1, prevX: head.x, prevY: head.y };
          break;
        case 'down':
          newHead = { x: head.x, y: head.y + 1, prevX: head.x, prevY: head.y };
          break;
        case 'left':
          newHead = { x: head.x - 1, y: head.y, prevX: head.x, prevY: head.y };
          break;
        case 'right':
          newHead = { x: head.x + 1, y: head.y, prevX: head.x, prevY: head.y };
          break;
      }

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GAME_CONFIG.GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GAME_CONFIG.GRID_SIZE
      ) {
        // Game Over
        const stats: RunStats = {
          score: prev.score,
          survivalTime: now - prev.startTime,
          maxLength: prev.maxLength,
          maxSpeed: prev.maxSpeed,
          maxCombo: prev.maxCombo,
          riskZoneScore: prev.riskZoneScore,
        };
        setLastRunStats(stats);

        const newScores: HighScores = {
          best: Math.max(highScores.best, prev.score),
          lastScore: prev.score,
          bestCombo: Math.max(highScores.bestCombo, prev.maxCombo),
          bestLength: Math.max(highScores.bestLength, prev.maxLength),
          bestTime: Math.max(highScores.bestTime, now - prev.startTime),
        };
        setHighScores(newScores);
        saveHighScores(newScores);

        return { ...prev, status: 'gameover', direction, particles };
      }

      // Check self collision (unless ghost mode)
      const isGhost = activeEffects.some((e) => e.type === 'ghost');
      if (!isGhost && prev.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        // Game Over
        const stats: RunStats = {
          score: prev.score,
          survivalTime: now - prev.startTime,
          maxLength: prev.maxLength,
          maxSpeed: prev.maxSpeed,
          maxCombo: prev.maxCombo,
          riskZoneScore: prev.riskZoneScore,
        };
        setLastRunStats(stats);

        const newScores: HighScores = {
          best: Math.max(highScores.best, prev.score),
          lastScore: prev.score,
          bestCombo: Math.max(highScores.bestCombo, prev.maxCombo),
          bestLength: Math.max(highScores.bestLength, prev.maxLength),
          bestTime: Math.max(highScores.bestTime, now - prev.startTime),
        };
        setHighScores(newScores);
        saveHighScores(newScores);

        return { ...prev, status: 'gameover', direction, particles };
      }

      // Build new snake
      let newSnake = [newHead, ...prev.snake];
      let newFood = prev.food;
      let newScore = prev.score;
      let newSpeed = prev.speed;
      let newMaxSpeed = prev.maxSpeed;
      let newMaxLength = prev.maxLength;
      let newCombo = combo;
      let newMaxCombo = prev.maxCombo;
      let newShowComboText = showComboText;
      let newComboTimer = prev.comboTimer;
      let newSpecialItem = specialItem;
      const newActiveEffects = [...activeEffects];
      let newLastFoodTime = prev.lastFoodTime;
      let newRiskZone = riskZone;
      let newRiskZoneScore = prev.riskZoneScore;
      let newInRiskZone = prev.inRiskZone;

      // Check if head is currently in risk zone
      const headInRiskZone = isInRiskZone(newHead, newRiskZone);

      // Track entering risk zone
      if (headInRiskZone && !prev.inRiskZone) {
        newInRiskZone = true;
      }

      // Check if player tried to EXIT the risk zone (DEATH!)
      if (prev.inRiskZone && newRiskZone && !headInRiskZone) {
        // Player left the risk zone - GAME OVER!
        const stats: RunStats = {
          score: prev.score,
          survivalTime: now - prev.startTime,
          maxLength: prev.maxLength,
          maxSpeed: prev.maxSpeed,
          maxCombo: prev.maxCombo,
          riskZoneScore: prev.riskZoneScore,
        };
        setLastRunStats(stats);

        const newScores: HighScores = {
          best: Math.max(highScores.best, prev.score),
          lastScore: prev.score,
          bestCombo: Math.max(highScores.bestCombo, prev.maxCombo),
          bestLength: Math.max(highScores.bestLength, prev.maxLength),
          bestTime: Math.max(highScores.bestTime, now - prev.startTime),
        };
        setHighScores(newScores);
        saveHighScores(newScores);

        return { ...prev, status: 'gameover', direction, particles };
      }

      // Reset inRiskZone flag when risk zone expires
      if (!newRiskZone && prev.inRiskZone) {
        newInRiskZone = false;
      }

      // Update camera state
      let newCameraState = { ...prev.cameraState };

      // Calculate speed percentage for zoom
      const speedRange = GAME_CONFIG.INITIAL_SPEED - GAME_CONFIG.MIN_SPEED;
      const currentSpeedProgress = (GAME_CONFIG.INITIAL_SPEED - prev.speed) / speedRange;

      // Target zoom based on speed (zoom out slightly at high speed)
      const speedZoom = GAME_CONFIG.CAMERA_ZOOM_MIN - (1 - GAME_CONFIG.CAMERA_ZOOM_SPEED_MAX) * currentSpeedProgress;

      // Use headInRiskZone for slight zoom adjustment (already computed above)
      const riskZoom = headInRiskZone ? GAME_CONFIG.CAMERA_ZOOM_RISK : 1.0;

      // Detect near-miss for intensity
      const nearMiss = detectNearMiss(newHead, prev.snake, isGhost);
      if (nearMiss) {
        newCameraState.nearMissTimer = now;
        newCameraState.intensity = Math.min(1, newCameraState.intensity + 0.3);
      }

      // Decay near-miss effect
      if (now - newCameraState.nearMissTimer > GAME_CONFIG.CAMERA_NEAR_MISS_DURATION) {
        newCameraState.intensity *= 0.95;
      }

      // Set target zoom (combine factors)
      newCameraState.targetZoom = speedZoom * riskZoom;

      // Smooth zoom transition
      newCameraState.zoom += (newCameraState.targetZoom - newCameraState.zoom) * GAME_CONFIG.CAMERA_SMOOTH_FACTOR;

      // Decay shake
      newCameraState.shake *= GAME_CONFIG.CAMERA_SHAKE_DECAY;

      // Check food collision
      const ateFood = newHead.x === newFood.x && newHead.y === newFood.y;
      if (ateFood) {
        // Check if snake head is in risk zone (you get bonus for being in danger!)
        const headInRiskZone = isInRiskZone(newHead, newRiskZone);

        // Calculate combo
        const timeSinceLastFood = now - prev.lastFoodTime;
        if (timeSinceLastFood < GAME_CONFIG.COMBO_WINDOW) {
          // Extra combo boost in risk zone
          const comboBoostAmount = headInRiskZone ? GAME_CONFIG.RISK_ZONE_COMBO_BOOST : 1;
          newCombo = combo + comboBoostAmount;
          newShowComboText = true;
        } else {
          newCombo = 1;
        }
        newComboTimer = now;
        newLastFoodTime = now;
        newMaxCombo = Math.max(newMaxCombo, newCombo);

        // Calculate points with risk zone multiplier
        const isDouble = newActiveEffects.some((e) => e.type === 'double');
        const basePoints = 10;
        const comboBonus = Math.floor(basePoints * newCombo * GAME_CONFIG.COMBO_MULTIPLIER);
        let pointsEarned = (basePoints + comboBonus) * (isDouble ? GAME_CONFIG.DOUBLE_POINTS : 1);

        // Apply risk zone multiplier
        if (headInRiskZone) {
          pointsEarned = Math.floor(pointsEarned * GAME_CONFIG.RISK_ZONE_POINTS_MULTIPLIER);
          newRiskZoneScore += pointsEarned;
          // Add camera shake for risk zone score
          newCameraState.shake = 3;
          newCameraState.intensity = 1;
        }

        newScore += pointsEarned;

        // Create particles (more in risk zone)
        const particleCount = headInRiskZone ? 16 : 8;
        const particleColor = headInRiskZone ? COLORS.COMBO_TEXT : COLORS.FOOD_PRIMARY;
        particles = [...particles, ...createParticles(newFood.x, newFood.y, particleColor, particleCount)];

        // Speed up
        newSpeed = Math.max(GAME_CONFIG.MIN_SPEED, newSpeed - GAME_CONFIG.SPEED_DECREASE);
        newMaxSpeed = Math.min(newMaxSpeed, newSpeed);
        newMaxLength = Math.max(newMaxLength, newSnake.length);

        // Spawn new food
        newFood = randomPosition(newSnake);

        // Maybe spawn special item
        if (!newSpecialItem && Math.random() < GAME_CONFIG.SPECIAL_SPAWN_CHANCE) {
          newSpecialItem = {
            type: randomSpecialType(),
            position: randomPosition([...newSnake, newFood]),
            spawnTime: now,
            duration: GAME_CONFIG.SPECIAL_DURATION,
          };
        }

        // Maybe spawn risk zone
        if (!newRiskZone && Math.random() < GAME_CONFIG.RISK_ZONE_SPAWN_CHANCE) {
          newRiskZone = generateRiskZone();
        }
      } else {
        // Remove tail if didn't eat
        newSnake = newSnake.slice(0, -1);
      }

      // Check special item collision
      if (newSpecialItem && newHead.x === newSpecialItem.position.x && newHead.y === newSpecialItem.position.y) {
        const type = newSpecialItem.type;
        particles = [...particles, ...createParticles(newSpecialItem.position.x, newSpecialItem.position.y, COLORS.TEXT_ACCENT, 12)];

        if (type === 'shrink') {
          // Immediate effect: remove segments
          const removeCount = Math.min(GAME_CONFIG.SHRINK_AMOUNT, newSnake.length - 3);
          if (removeCount > 0) {
            newSnake = newSnake.slice(0, -removeCount);
          }
        } else {
          // Timed effect
          newActiveEffects.push({
            type,
            endTime: now + GAME_CONFIG.EFFECT_DURATION,
          });
        }

        newSpecialItem = null;
      }

      return {
        ...prev,
        status: 'playing',
        snake: newSnake,
        direction,
        food: newFood,
        specialItem: newSpecialItem,
        activeEffects: newActiveEffects,
        score: newScore,
        combo: newCombo,
        comboTimer: newComboTimer,
        maxCombo: newMaxCombo,
        speed: newSpeed,
        maxSpeed: newMaxSpeed,
        maxLength: newMaxLength,
        survivalTime: now - prev.startTime,
        particles,
        showComboText: newShowComboText,
        lastFoodTime: newLastFoodTime,
        riskZone: newRiskZone,
        cameraState: newCameraState,
        riskZoneScore: newRiskZoneScore,
        inRiskZone: newInRiskZone,
      };
    });
  }, [highScores]);

  // Store gameTick in ref for interval access
  const gameTickRef = useRef(gameTick);
  useEffect(() => {
    gameTickRef.current = gameTick;
  }, [gameTick]);

  // Game loop using setInterval for reliable timing
  useEffect(() => {
    if (gameState.status !== 'playing') {
      return;
    }

    const intervalId = setInterval(() => {
      gameTickRef.current();
    }, gameState.speed);

    return () => {
      clearInterval(intervalId);
    };
  }, [gameState.status, gameState.speed]);

  return {
    gameState,
    highScores,
    lastRunStats,
    startGame,
    changeDirection,
    togglePause,
    hasEffect,
    getEffectiveSpeed,
  };
}
