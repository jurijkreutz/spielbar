'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '@/lib/analytics';
import { TrackedLink } from '@/components/platform/TrackedLink';
import { readStorage, writeStorage } from '@/lib/safeStorage';
import { LEVEL_PATTERNS, buildBricks, getPowerupDrop, normalizeVelocity } from '../lib/brickbreakerLogic';
import type { Brick } from '../lib/brickbreakerLogic';

type GameStatus = 'idle' | 'playing' | 'level-clear' | 'gameover' | 'win';
type PowerupType = 'multi' | 'wide' | 'slow';

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
};

type Paddle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FallingPowerup = {
  type: PowerupType;
  x: number;
  y: number;
  size: number;
  vy: number;
};

type ActivePowerup = {
  type: PowerupType;
  endsAt: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
};

type GameState = {
  status: GameStatus;
  level: number;
  score: number;
  best: number;
  bricks: Brick[];
  bricksRemaining: number;
  totalBricks: number;
  paddle: Paddle;
  balls: Ball[];
  particles: Particle[];
  powerup: {
    falling: FallingPowerup | null;
    active: ActivePowerup | null;
  };
  speedModifier: number;
  runStart: number;
  lastTime: number;
};

type InputState = {
  mode: 'pointer' | 'keyboard';
  pointerX: number | null;
  keys: { left: boolean; right: boolean };
  lastMoveDir: number;
};

type UiState = {
  status: GameStatus;
  level: number;
  score: number;
  best: number;
  activePowerup: ActivePowerup | null;
};

const STORAGE_KEY = 'brickbreaker-bestscore';

const GAME_CONFIG = {
  CANVAS_WIDTH: 720,
  CANVAS_HEIGHT: 480,
  PADDLE_BASE_WIDTH: 110,
  PADDLE_HEIGHT: 12,
  PADDLE_MARGIN_BOTTOM: 24,
  PADDLE_SPEED: 720,
  BALL_RADIUS: 6,
  LEVEL_SPEEDS: [320, 340, 360, 380, 400],
  BRICK_TOP_OFFSET: 56,
  BRICK_HEIGHT: 20,
  BRICK_GAP: 8,
  BRICK_PADDING_X: 40,
  POINTS_PER_BRICK: 100,
  LEVEL_CLEAR_BONUS: 500,
  POWERUP_DROP_CHANCE: 4,
};

const POWERUP_TYPES: PowerupType[] = ['multi', 'wide', 'slow'];

const POWERUP_INFO: Record<PowerupType, { label: string; icon: string; duration: number; badgeClass: string; dropFill: string; dropText: string }> = {
  multi: {
    label: 'Multi-Ball',
    icon: 'x3',
    duration: 8000,
    badgeClass: 'bg-amber-100 text-amber-700',
    dropFill: '#FCD34D',
    dropText: '#92400E',
  },
  wide: {
    label: 'Wider Paddle',
    icon: 'WIDE',
    duration: 10000,
    badgeClass: 'bg-emerald-100 text-emerald-700',
    dropFill: '#6EE7B7',
    dropText: '#065F46',
  },
  slow: {
    label: 'Slow',
    icon: 'SLOW',
    duration: 7000,
    badgeClass: 'bg-sky-100 text-sky-700',
    dropFill: '#93C5FD',
    dropText: '#1E40AF',
  },
};

const BRICK_STYLES = [
  { base: '#C7D2FE', border: '#818CF8', accent: 'rgba(99,102,241,0.4)' },
  { base: '#FBC8A8', border: '#F59E0B', accent: 'rgba(245,158,11,0.35)' },
  { base: '#BBF7D0', border: '#22C55E', accent: 'rgba(34,197,94,0.35)' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const BRICK_LAYOUT = {
  canvasWidth: GAME_CONFIG.CANVAS_WIDTH,
  brickPaddingX: GAME_CONFIG.BRICK_PADDING_X,
  brickGap: GAME_CONFIG.BRICK_GAP,
  brickHeight: GAME_CONFIG.BRICK_HEIGHT,
  brickTopOffset: GAME_CONFIG.BRICK_TOP_OFFSET,
};

function loadBestScore(): number {
  try {
    const stored = readStorage('local', STORAGE_KEY);
    return stored ? Number.parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number) {
  try {
    writeStorage('local', STORAGE_KEY, String(score));
  } catch {
    // ignore storage errors
  }
}

function createParticleBurst(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * 80,
      vy: Math.sin(angle) * 80,
      life: 0.5,
      size: 2 + (i % 2),
    });
  }
  return particles;
}

function createBall(paddle: Paddle): Ball {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - GAME_CONFIG.BALL_RADIUS - 1,
    vx: 0,
    vy: 0,
    radius: GAME_CONFIG.BALL_RADIUS,
    speed: GAME_CONFIG.LEVEL_SPEEDS[0],
  };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function circleRectCollision(ball: Ball, brick: Brick): boolean {
  const closestX = clamp(ball.x, brick.x, brick.x + brick.width);
  const closestY = clamp(ball.y, brick.y, brick.y + brick.height);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function getBallSpeed(state: GameState): number {
  const base = GAME_CONFIG.LEVEL_SPEEDS[state.level - 1] || GAME_CONFIG.LEVEL_SPEEDS[0];
  const progress = state.totalBricks > 0 ? (state.totalBricks - state.bricksRemaining) / state.totalBricks : 0;
  const ramp = 1 + Math.min(0.18, progress * 0.18);
  return base * ramp * state.speedModifier;
}

function normalizeBall(ball: Ball, preferredDir: number) {
  if (ball.speed <= 0) return;
  const normalized = normalizeVelocity(ball.vx, ball.vy, ball.speed, preferredDir);
  ball.vx = normalized.vx;
  ball.vy = normalized.vy;
}

export function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  const [ui, setUi] = useState<UiState>({
    status: 'idle',
    level: 1,
    score: 0,
    best: 0,
    activePowerup: null,
  });

  const [powerupSeconds, setPowerupSeconds] = useState(0);

  const initialPaddle: Paddle = {
    x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_BASE_WIDTH) / 2,
    y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PADDLE_MARGIN_BOTTOM - GAME_CONFIG.PADDLE_HEIGHT,
    width: GAME_CONFIG.PADDLE_BASE_WIDTH,
    height: GAME_CONFIG.PADDLE_HEIGHT,
  };

  const initialBricks = buildBricks(1, BRICK_LAYOUT, LEVEL_PATTERNS);

  const gameRef = useRef<GameState>({
    status: 'idle',
    level: 1,
    score: 0,
    best: 0,
    bricks: initialBricks,
    bricksRemaining: initialBricks.length,
    totalBricks: initialBricks.length,
    paddle: initialPaddle,
    balls: [createBall(initialPaddle)],
    particles: [],
    powerup: { falling: null, active: null },
    speedModifier: 1,
    runStart: 0,
    lastTime: 0,
  });

  const inputRef = useRef<InputState>({
    mode: 'pointer',
    pointerX: null,
    keys: { left: false, right: false },
    lastMoveDir: 1,
  });

  const updateUi = useCallback((partial: Partial<UiState>) => {
    setUi((prev) => ({ ...prev, ...partial }));
  }, []);

  const setupLevel = useCallback((level: number, status: GameStatus, score: number, keepRunStart: boolean = false) => {
    const bricks = buildBricks(level, BRICK_LAYOUT, LEVEL_PATTERNS);
    const paddle: Paddle = {
      x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_BASE_WIDTH) / 2,
      y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PADDLE_MARGIN_BOTTOM - GAME_CONFIG.PADDLE_HEIGHT,
      width: GAME_CONFIG.PADDLE_BASE_WIDTH,
      height: GAME_CONFIG.PADDLE_HEIGHT,
    };
    const state = gameRef.current;
    state.level = level;
    state.status = status;
    state.score = score;
    state.bricks = bricks;
    state.bricksRemaining = bricks.length;
    state.totalBricks = bricks.length;
    state.paddle = paddle;
    state.balls = [createBall(paddle)];
    state.particles = [];
    state.powerup = { falling: null, active: null };
    state.speedModifier = 1;
    state.lastTime = 0;
    if (!keepRunStart) {
      state.runStart = status === 'playing' ? performance.now() : 0;
    }
    updateUi({ level, status, score, activePowerup: null });
  }, [updateUi]);

  const launchBall = useCallback(() => {
    const state = gameRef.current;
    const ball = state.balls[0];
    if (!ball) return;
    const speed = getBallSpeed(state);
    const dir = inputRef.current.lastMoveDir || 1;
    const angle = -Math.PI / 2 + dir * (Math.PI / 7);
    ball.speed = speed;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
  }, []);

  const spawnExtraBalls = useCallback(() => {
    const state = gameRef.current;
    if (state.balls.length === 0) return;
    const baseBall = state.balls[0];
    const speed = getBallSpeed(state);
    const baseAngle = baseBall.vx === 0 && baseBall.vy === 0
      ? -Math.PI / 2 + (inputRef.current.lastMoveDir * Math.PI / 8)
      : Math.atan2(baseBall.vy, baseBall.vx);
    const offsets = [-0.35, 0.35];
    offsets.forEach((offset) => {
      if (state.balls.length >= 3) return;
      const angle = baseAngle + offset;
      state.balls.push({
        x: baseBall.x,
        y: baseBall.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: GAME_CONFIG.BALL_RADIUS,
        speed,
      });
    });
  }, []);

  const deactivatePowerup = useCallback(() => {
    const state = gameRef.current;
    const active = state.powerup.active;
    if (!active) return;

    if (active.type === 'wide') {
      state.paddle.width = GAME_CONFIG.PADDLE_BASE_WIDTH;
      state.paddle.x = clamp(state.paddle.x, 0, GAME_CONFIG.CANVAS_WIDTH - state.paddle.width);
    }

    if (active.type === 'slow') {
      state.speedModifier = 1;
    }

    if (active.type === 'multi' && state.balls.length > 1) {
      state.balls.sort((a, b) => b.y - a.y);
      state.balls = [state.balls[0]];
    }

    state.powerup.active = null;
    updateUi({ activePowerup: null });
  }, [updateUi]);

  const activatePowerup = useCallback((type: PowerupType) => {
    const state = gameRef.current;
    if (state.powerup.active) return;
    const now = Date.now();
    state.powerup.active = {
      type,
      endsAt: now + POWERUP_INFO[type].duration,
    };

    if (type === 'wide') {
      state.paddle.width = GAME_CONFIG.PADDLE_BASE_WIDTH * 1.55;
      state.paddle.x = clamp(state.paddle.x, 0, GAME_CONFIG.CANVAS_WIDTH - state.paddle.width);
    }

    if (type === 'slow') {
      state.speedModifier = 0.75;
    }

    if (type === 'multi') {
      spawnExtraBalls();
    }

    updateUi({ activePowerup: state.powerup.active });
  }, [spawnExtraBalls, updateUi]);

  const maybeSpawnPowerup = useCallback((brick: Brick) => {
    const state = gameRef.current;
    if (state.powerup.active || state.powerup.falling) return;
    const type = getPowerupDrop(brick.id, state.level, GAME_CONFIG.POWERUP_DROP_CHANCE, POWERUP_TYPES);
    if (!type) return;
    state.powerup.falling = {
      type,
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      size: 26,
      vy: 140,
    };
  }, []);

  const handleGameEnd = useCallback((result: 'win' | 'lose') => {
    const state = gameRef.current;
    if (state.status === 'gameover' || state.status === 'win') return;

    state.status = result === 'win' ? 'win' : 'gameover';
    state.powerup.active = null;
    state.powerup.falling = null;
    state.speedModifier = 1;

    const duration = state.runStart ? (performance.now() - state.runStart) / 1000 : 0;
    analytics.trackGameEnd('brick-breaker', 'free', result, Math.max(1, Math.round(duration)));

    if (state.score > state.best) {
      state.best = state.score;
      saveBestScore(state.best);
    }

    updateUi({
      status: state.status,
      score: state.score,
      best: state.best,
      activePowerup: null,
    });
  }, [updateUi]);

  const handleLevelClear = useCallback(() => {
    const state = gameRef.current;
    if (state.status !== 'playing') return;

    const updatedScore = state.score + GAME_CONFIG.LEVEL_CLEAR_BONUS * state.level;
    state.score = updatedScore;
    updateUi({ score: updatedScore });

    if (state.level >= LEVEL_PATTERNS.length) {
      handleGameEnd('win');
      return;
    }

    const nextLevel = state.level + 1;
    setupLevel(nextLevel, 'level-clear', updatedScore, true);
  }, [handleGameEnd, setupLevel, updateUi]);

  const updatePaddle = useCallback((dt: number) => {
    const state = gameRef.current;
    const input = inputRef.current;
    let nextX = state.paddle.x;

    if (input.mode === 'pointer' && input.pointerX !== null) {
      nextX = input.pointerX - state.paddle.width / 2;
    } else {
      let direction = 0;
      if (input.keys.left) direction -= 1;
      if (input.keys.right) direction += 1;
      if (direction !== 0) {
        nextX += direction * GAME_CONFIG.PADDLE_SPEED * dt;
      }
    }

    nextX = clamp(nextX, 0, GAME_CONFIG.CANVAS_WIDTH - state.paddle.width);
    const delta = nextX - state.paddle.x;
    if (Math.abs(delta) > 0.1) {
      input.lastMoveDir = delta > 0 ? 1 : -1;
    }
    state.paddle.x = nextX;
  }, []);

  const updateParticles = useCallback((dt: number) => {
    const state = gameRef.current;
    state.particles = state.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        vy: p.vy + 160 * dt,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);
  }, []);

  const updatePowerups = useCallback((dt: number, now: number) => {
    const state = gameRef.current;

    if (state.powerup.active && now >= state.powerup.active.endsAt) {
      deactivatePowerup();
    }

    const falling = state.powerup.falling;
    if (!falling) return;

    falling.y += falling.vy * dt;

    if (falling.y - falling.size / 2 > GAME_CONFIG.CANVAS_HEIGHT) {
      state.powerup.falling = null;
      return;
    }

    const paddle = state.paddle;
    if (
      falling.x >= paddle.x &&
      falling.x <= paddle.x + paddle.width &&
      falling.y + falling.size / 2 >= paddle.y &&
      falling.y - falling.size / 2 <= paddle.y + paddle.height
    ) {
      state.powerup.falling = null;
      activatePowerup(falling.type);
    }
  }, [activatePowerup, deactivatePowerup]);

  const updateBalls = useCallback((dt: number) => {
    const state = gameRef.current;
    const targetSpeed = getBallSpeed(state);
    const nextBalls: Ball[] = [];

    for (const ball of state.balls) {
      const currentSpeed = Math.hypot(ball.vx, ball.vy);
      if (currentSpeed === 0) {
        const dir = inputRef.current.lastMoveDir || 1;
        const angle = -Math.PI / 2 + dir * (Math.PI / 7);
        ball.vx = Math.cos(angle) * targetSpeed;
        ball.vy = Math.sin(angle) * targetSpeed;
      } else if (Math.abs(currentSpeed - targetSpeed) > 0.1) {
        ball.vx = (ball.vx / currentSpeed) * targetSpeed;
        ball.vy = (ball.vy / currentSpeed) * targetSpeed;
      }

      ball.speed = targetSpeed;

      const distance = targetSpeed * dt;
      const steps = Math.max(1, Math.ceil(distance / 6));
      const stepDt = dt / steps;
      let lost = false;

      for (let step = 0; step < steps; step += 1) {
        const prevX = ball.x;
        const prevY = ball.y;

        ball.x += ball.vx * stepDt;
        ball.y += ball.vy * stepDt;

        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x + ball.radius >= GAME_CONFIG.CANVAS_WIDTH) {
          ball.x = GAME_CONFIG.CANVAS_WIDTH - ball.radius;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
        }

        const paddle = state.paddle;
        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= paddle.y &&
          ball.y + ball.radius <= paddle.y + paddle.height &&
          ball.x >= paddle.x - ball.radius &&
          ball.x <= paddle.x + paddle.width + ball.radius
        ) {
          const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          let clamped = clamp(hitPos, -1, 1);
          if (Math.abs(clamped) < 0.08) {
            clamped = 0.08 * (inputRef.current.lastMoveDir || (ball.vx >= 0 ? 1 : -1));
          }
          const maxAngle = Math.PI * 0.36;
          const angle = clamped * maxAngle;
          ball.vx = Math.sin(angle) * targetSpeed;
          ball.vy = -Math.cos(angle) * targetSpeed;
          ball.y = paddle.y - ball.radius - 1;
          normalizeBall(ball, inputRef.current.lastMoveDir);
        }

        let hitBrick = false;
        for (const brick of state.bricks) {
          if (!brick.alive) continue;
          if (!circleRectCollision(ball, brick)) continue;

          brick.alive = false;
          state.bricksRemaining -= 1;
          state.score += GAME_CONFIG.POINTS_PER_BRICK;
          updateUi({ score: state.score });
          state.particles.push(...createParticleBurst(ball.x, ball.y));
          maybeSpawnPowerup(brick);

          const left = brick.x;
          const right = brick.x + brick.width;
          const top = brick.y;
          const bottom = brick.y + brick.height;

          const fromLeft = prevX + ball.radius <= left;
          const fromRight = prevX - ball.radius >= right;
          const fromTop = prevY + ball.radius <= top;
          const fromBottom = prevY - ball.radius >= bottom;

          if (fromTop && ball.y + ball.radius >= top) {
            ball.y = top - ball.radius;
            ball.vy = -Math.abs(ball.vy);
          } else if (fromBottom && ball.y - ball.radius <= bottom) {
            ball.y = bottom + ball.radius;
            ball.vy = Math.abs(ball.vy);
          } else if (fromLeft && ball.x + ball.radius >= left) {
            ball.x = left - ball.radius;
            ball.vx = -Math.abs(ball.vx);
          } else if (fromRight && ball.x - ball.radius <= right) {
            ball.x = right + ball.radius;
            ball.vx = Math.abs(ball.vx);
          } else {
            ball.vy = -ball.vy;
          }

          normalizeBall(ball, inputRef.current.lastMoveDir);
          hitBrick = true;
          break;
        }

        if (!hitBrick) {
          normalizeBall(ball, inputRef.current.lastMoveDir);
        }

        if (ball.y - ball.radius > GAME_CONFIG.CANVAS_HEIGHT + 20) {
          lost = true;
          break;
        }
      }

      if (!lost) {
        nextBalls.push(ball);
      }
    }

    state.balls = nextBalls;

    if (state.bricksRemaining <= 0) {
      handleLevelClear();
      return;
    }

    if (state.balls.length === 0) {
      handleGameEnd('lose');
    }
  }, [handleGameEnd, handleLevelClear, maybeSpawnPowerup, updateUi]);

  const updateGame = useCallback((time: number) => {
    const state = gameRef.current;
    if (!state.lastTime) {
      state.lastTime = time;
    }
    const dt = Math.min(0.033, (time - state.lastTime) / 1000);
    state.lastTime = time;

    updatePaddle(dt);

    if (state.status === 'playing') {
      updatePowerups(dt, Date.now());
      updateBalls(dt);
      updateParticles(dt);
    } else {
      const ball = state.balls[0];
      if (ball) {
        ball.x = state.paddle.x + state.paddle.width / 2;
        ball.y = state.paddle.y - ball.radius - 1;
        ball.vx = 0;
        ball.vy = 0;
      }
      if (state.powerup.active) {
        deactivatePowerup();
      }
      state.powerup.falling = null;
    }
  }, [deactivatePowerup, updateBalls, updatePaddle, updateParticles, updatePowerups]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameRef.current;

    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#F5F7FF');
    gradient.addColorStop(1, '#E4ECF9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    const glow = ctx.createRadialGradient(
      GAME_CONFIG.CANVAS_WIDTH * 0.5,
      -40,
      40,
      GAME_CONFIG.CANVAS_WIDTH * 0.5,
      -40,
      GAME_CONFIG.CANVAS_WIDTH * 0.9
    );
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(100,116,139,0.1)';
    ctx.lineWidth = 1;
    for (let y = 40; y < GAME_CONFIG.CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
      ctx.stroke();
    }

    for (const brick of state.bricks) {
      if (!brick.alive) continue;
      const style = BRICK_STYLES[brick.style];
      ctx.save();
      ctx.shadowColor = 'rgba(15,23,42,0.12)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = style.base;
      drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 6);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = style.border;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.45;

      if (brick.style === 0) {
        ctx.strokeStyle = style.accent;
        for (let i = 0; i < brick.width; i += 8) {
          ctx.beginPath();
          ctx.moveTo(brick.x + i, brick.y + 2);
          ctx.lineTo(brick.x + i - 6, brick.y + brick.height - 2);
          ctx.stroke();
        }
      } else if (brick.style === 1) {
        ctx.fillStyle = style.accent;
        for (let i = 0; i < brick.width; i += 10) {
          ctx.beginPath();
          ctx.arc(brick.x + i + 4, brick.y + brick.height / 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = style.accent;
        ctx.beginPath();
        ctx.moveTo(brick.x + 4, brick.y + 4);
        ctx.lineTo(brick.x + brick.width - 4, brick.y + 4);
        ctx.stroke();
      }

      ctx.restore();
    }

    const paddle = state.paddle;
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    paddleGradient.addColorStop(0, '#1E293B');
    paddleGradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = paddleGradient;
    drawRoundedRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(paddle.x + 8, paddle.y + 2, Math.max(0, paddle.width - 16), 2);

    for (const ball of state.balls) {
      ctx.save();
      ctx.shadowColor = 'rgba(56,189,248,0.25)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
      ctx.restore();
    }

    if (state.powerup.falling) {
      const info = POWERUP_INFO[state.powerup.falling.type];
      const size = state.powerup.falling.size;
      const x = state.powerup.falling.x - size / 2;
      const y = state.powerup.falling.y - size / 2;
      ctx.fillStyle = info.dropFill;
      drawRoundedRect(ctx, x, y, size, size, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,23,42,0.2)';
      ctx.stroke();
      ctx.fillStyle = info.dropText;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.icon, state.powerup.falling.x, state.powerup.falling.y + 0.5);
    }

    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  const startRun = useCallback((restart: boolean) => {
    if (restart) {
      analytics.trackGameRestart('brick-breaker', 'free');
    }
    analytics.trackGameStart('brick-breaker', 'free', {
      name: 'Brick Breaker',
      href: '/games/brick-breaker',
    });
    setupLevel(1, 'playing', 0);
    launchBall();
  }, [launchBall, setupLevel]);

  const continueLevel = useCallback(() => {
    const state = gameRef.current;
    if (state.status !== 'level-clear') return;
    state.status = 'playing';
    state.runStart = state.runStart || performance.now();
    updateUi({ status: 'playing' });
    launchBall();
  }, [launchBall, updateUi]);

  const handlePrimaryAction = useCallback(() => {
    const state = gameRef.current;
    if (state.status === 'playing') return;

    if (state.status === 'level-clear') {
      continueLevel();
      return;
    }

    startRun(state.status !== 'idle');
  }, [continueLevel, startRun]);

  const getCanvasX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * GAME_CONFIG.CANVAS_WIDTH;
    return clamp(x, 0, GAME_CONFIG.CANVAS_WIDTH);
  }, []);

  const handlePointerMove = useCallback((clientX: number) => {
    const x = getCanvasX(clientX);
    if (x === null) return;
    inputRef.current.mode = 'pointer';
    inputRef.current.pointerX = x;
  }, [getCanvasX]);

  const nudgePaddle = useCallback((direction: -1 | 1) => {
    const state = gameRef.current;
    const center = state.paddle.x + state.paddle.width / 2 + direction * 36;
    inputRef.current.mode = 'pointer';
    inputRef.current.pointerX = clamp(center, 0, GAME_CONFIG.CANVAS_WIDTH);
    inputRef.current.lastMoveDir = direction;
  }, []);

  useEffect(() => {
    const best = loadBestScore();
    gameRef.current.best = best;
    updateUi({ best });
  }, [updateUi]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handlePrimaryAction();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        inputRef.current.mode = 'keyboard';
        inputRef.current.pointerX = null;
        inputRef.current.keys.left = true;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        inputRef.current.mode = 'keyboard';
        inputRef.current.pointerX = null;
        inputRef.current.keys.right = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        inputRef.current.keys.left = false;
      }
      if (event.key === 'ArrowRight') {
        inputRef.current.keys.right = false;
      }
    };

    const handleBlur = () => {
      inputRef.current.keys.left = false;
      inputRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handlePrimaryAction]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const updateTouch = () => {
      setIsTouchDevice(
        mediaQuery.matches || navigator.maxTouchPoints > 0 || window.innerWidth < 768
      );
      setIsNarrowViewport(window.innerWidth <= 768);
    };
    updateTouch();
    window.addEventListener('resize', updateTouch);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateTouch);
      return () => {
        window.removeEventListener('resize', updateTouch);
        mediaQuery.removeEventListener('change', updateTouch);
      };
    }

    mediaQuery.addListener(updateTouch);
    return () => {
      window.removeEventListener('resize', updateTouch);
      mediaQuery.removeListener(updateTouch);
    };
  }, []);

  useEffect(() => {
    let frameId = 0;

    const tick = (time: number) => {
      updateGame(time);
      draw();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [draw, updateGame]);

  useEffect(() => {
    if (!ui.activePowerup) {
      setPowerupSeconds(0);
      return;
    }

    const updateTimer = () => {
      if (!ui.activePowerup) return;
      const remaining = Math.max(0, Math.ceil((ui.activePowerup.endsAt - Date.now()) / 1000));
      setPowerupSeconds(remaining);
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(intervalId);
  }, [ui.activePowerup]);

  const activePowerupInfo = ui.activePowerup ? POWERUP_INFO[ui.activePowerup.type] : null;
  const maxLevel = LEVEL_PATTERNS.length;
  const isEndOverlay = ui.status === 'gameover' || ui.status === 'win';
  const compactEndScreen = isEndOverlay && (isTouchDevice || isNarrowViewport);

  return (
    <div className="flex flex-col items-center gap-6 p-2 sm:p-4 w-full">
      <div className={`${compactEndScreen ? 'hidden' : 'flex'} flex-wrap items-center justify-center gap-6 text-center`}>
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Score</div>
          <div className="text-3xl font-bold text-zinc-900">{ui.score}</div>
        </div>
        <div className="h-10 w-px bg-zinc-200 hidden sm:block" />
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Best</div>
          <div className="text-3xl font-bold text-amber-600">{ui.best}</div>
        </div>
        <div className="h-10 w-px bg-zinc-200 hidden sm:block" />
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Level</div>
          <div className="text-3xl font-bold text-zinc-900">
            {ui.level}/{maxLevel}
          </div>
        </div>
        {activePowerupInfo && (
          <>
            <div className="h-10 w-px bg-zinc-200 hidden md:block" />
            <div className="flex flex-col items-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wide">Powerup</div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${activePowerupInfo.badgeClass}`}>
                {activePowerupInfo.label} · {powerupSeconds}s
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className="relative select-none touch-none w-full max-w-[720px] aspect-[3/2] max-h-[68vh] sm:max-h-none"
        onClick={handlePrimaryAction}
        onMouseMove={(event) => handlePointerMove(event.clientX)}
        onMouseLeave={() => {
          inputRef.current.pointerX = null;
        }}
        onTouchStart={(event) => {
          if (event.touches[0]) {
            handlePointerMove(event.touches[0].clientX);
          }
          handlePrimaryAction();
        }}
        onTouchMove={(event) => {
          if (event.touches[0]) {
            handlePointerMove(event.touches[0].clientX);
          }
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="w-full h-full rounded-xl shadow-lg border border-zinc-200"
        />

        {ui.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">Brick Breaker</h2>
              <p className="mt-2 text-zinc-600">Klick oder Leertaste</p>
              <p className="text-xs text-zinc-500 mt-4">Maus/Trackpad oder Pfeile bewegen</p>
            </div>
          </div>
        )}

        {ui.status === 'level-clear' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-zinc-900">Level {ui.level} bereit</h2>
              <p className="mt-2 text-zinc-600">Klick oder Leertaste für weiter</p>
            </div>
          </div>
        )}

        {ui.status === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/65 rounded-xl">
            <div
              className={`text-center text-white w-full ${
                isNarrowViewport
                  ? 'max-w-[300px] rounded-2xl bg-zinc-900/60 px-4 py-5'
                  : 'max-w-[360px] px-4 sm:px-6'
              }`}
            >
              <h2 className="text-lg lg:text-2xl font-bold mb-2">Runde vorbei</h2>
              <div className="text-3xl lg:text-5xl font-bold mb-1">{ui.score}</div>
              <p className="text-white/70 text-sm lg:text-base mb-3 lg:mb-4">Score</p>
              {ui.score === ui.best && ui.score > 0 ? (
                <p className="text-amber-300 font-semibold text-sm lg:text-base mb-4">Neuer Bestscore</p>
              ) : (
                <p className="text-white/50 text-sm lg:text-base mb-4">Bestscore: {ui.best}</p>
              )}
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handlePrimaryAction();
                }}
                className="min-h-[44px] w-full max-w-[240px] px-6 py-2.5 lg:py-3 bg-white text-zinc-900 font-semibold text-base lg:text-lg rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Nochmal
              </button>
              <div className="mt-3 text-xs text-white/60">
                {isTouchDevice || isNarrowViewport ? 'Tippen zum Neustart' : 'Space oder Klick'}
              </div>
              <div
                onClick={(event) => event.stopPropagation()}
                className="mt-3 sm:mt-4"
              >
                <TrackedLink
                  href="/"
                  tracking={{ type: 'game_exit_to_overview', from: 'brick-breaker' }}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Alle Spiele
                </TrackedLink>
              </div>
            </div>
          </div>
        )}

        {ui.status === 'win' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm rounded-xl">
            <div
              className={`text-center w-full ${
                isNarrowViewport
                  ? 'max-w-[300px] rounded-2xl bg-white/90 px-4 py-5'
                  : 'max-w-[360px] px-4 sm:px-6'
              }`}
            >
              <h2 className="text-lg lg:text-2xl font-bold text-zinc-900">Alles geschafft</h2>
              <p className="mt-2 text-zinc-600 text-sm lg:text-base">Score: {ui.score}</p>
              {ui.score === ui.best && ui.score > 0 && (
                <p className="mt-2 text-emerald-700 font-semibold text-sm lg:text-base">Neuer Bestscore</p>
              )}
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handlePrimaryAction();
                }}
                className="mt-4 min-h-[44px] w-full max-w-[240px] px-6 py-2.5 lg:py-3 bg-zinc-900 text-white font-semibold text-base lg:text-lg rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Nochmal
              </button>
              <div className="mt-3 text-xs text-zinc-500">
                {isTouchDevice || isNarrowViewport ? 'Tippen zum Neustart' : 'Space oder Klick'}
              </div>
            </div>
          </div>
        )}
      </div>

      {isTouchDevice && ui.status === 'playing' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => nudgePaddle(-1)}
            className="min-h-[44px] min-w-[52px] rounded-lg bg-zinc-100 text-zinc-700 font-semibold"
            aria-label="Move paddle left"
          >
            ←
          </button>
          <button
            onClick={() => nudgePaddle(1)}
            className="min-h-[44px] min-w-[52px] rounded-lg bg-zinc-100 text-zinc-700 font-semibold"
            aria-label="Move paddle right"
          >
            →
          </button>
        </div>
      )}

      <div className={`text-center text-xs text-zinc-400 ${compactEndScreen ? 'hidden' : ''}`}>
        <p>Maus/Trackpad oder Pfeiltasten · Space/Klick = Start/Restart</p>
      </div>
    </div>
  );
}
