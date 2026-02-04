'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStackTower } from '../hooks/useStackTower';
import { GAME_CONFIG, SKY_COLORS, BLOCK_COLORS } from '../types/stacktower';

// Living Sky Types
interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  layer: number; // 0 = far, 1 = mid, 2 = close
}

interface Bird {
  x: number;
  y: number;
  speed: number;
  wingPhase: number;
  size: number;
  direction: 1 | -1;
}

interface Plane {
  x: number;
  y: number;
  speed: number;
  size: number;
  direction: 1 | -1;
}

// Generate initial clouds
function generateClouds(): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH + 200) - 100,
      y: 50 + Math.random() * 200,
      width: 60 + Math.random() * 80,
      height: 25 + Math.random() * 20,
      speed: 0.1 + Math.random() * 0.2,
      opacity: 0.3 + Math.random() * 0.4,
      layer: Math.floor(Math.random() * 3),
    });
  }
  return clouds;
}

// Draw a soft cloud
function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud, heightProgress: number) {
  const adjustedOpacity = cloud.opacity * (0.5 + heightProgress * 0.5);
  ctx.fillStyle = `rgba(255, 255, 255, ${adjustedOpacity})`;

  // Main body
  ctx.beginPath();
  ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy parts
  ctx.beginPath();
  ctx.ellipse(cloud.x - cloud.width * 0.3, cloud.y + 5, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cloud.x + cloud.width * 0.25, cloud.y + 3, cloud.width * 0.35, cloud.height * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cloud.x - cloud.width * 0.1, cloud.y - cloud.height * 0.3, cloud.width * 0.25, cloud.height * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw a simple bird silhouette
function drawBird(ctx: CanvasRenderingContext2D, bird: Bird) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.scale(bird.direction, 1);

  const wingOffset = Math.sin(bird.wingPhase) * 3;

  ctx.strokeStyle = 'rgba(60, 60, 80, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // Left wing
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-bird.size * 0.5, -bird.size * 0.3 + wingOffset, -bird.size, wingOffset);
  ctx.stroke();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(bird.size * 0.5, -bird.size * 0.3 + wingOffset, bird.size, wingOffset);
  ctx.stroke();

  ctx.restore();
}

// Draw a distant plane
function drawPlane(ctx: CanvasRenderingContext2D, plane: Plane) {
  ctx.save();
  ctx.translate(plane.x, plane.y);
  ctx.scale(plane.direction, 1);

  ctx.fillStyle = 'rgba(180, 180, 200, 0.3)';

  // Fuselage
  ctx.beginPath();
  ctx.ellipse(0, 0, plane.size * 2, plane.size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.beginPath();
  ctx.moveTo(-plane.size * 0.3, 0);
  ctx.lineTo(-plane.size * 0.5, -plane.size);
  ctx.lineTo(plane.size * 0.3, -plane.size * 0.8);
  ctx.lineTo(plane.size * 0.3, 0);
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-plane.size * 1.5, 0);
  ctx.lineTo(-plane.size * 2, -plane.size * 0.5);
  ctx.lineTo(-plane.size * 1.2, 0);
  ctx.fill();

  // Contrail
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-plane.size * 2, 0);
  ctx.lineTo(-plane.size * 8, plane.size * 0.2);
  ctx.stroke();

  ctx.restore();
}

function interpolateColor(score: number): string {
  const maxScore = SKY_COLORS[SKY_COLORS.length - 1].stop;
  const clampedScore = Math.min(score, maxScore);

  let lowerStop = SKY_COLORS[0];
  let upperStop = SKY_COLORS[1];

  for (let i = 0; i < SKY_COLORS.length - 1; i++) {
    if (clampedScore >= SKY_COLORS[i].stop && clampedScore <= SKY_COLORS[i + 1].stop) {
      lowerStop = SKY_COLORS[i];
      upperStop = SKY_COLORS[i + 1];
      break;
    }
  }

  const range = upperStop.stop - lowerStop.stop;
  const progress = range === 0 ? 0 : (clampedScore - lowerStop.stop) / range;

  const lower = lowerStop.color;
  const upper = upperStop.color;

  const r1 = parseInt(lower.slice(1, 3), 16);
  const g1 = parseInt(lower.slice(3, 5), 16);
  const b1 = parseInt(lower.slice(5, 7), 16);

  const r2 = parseInt(upper.slice(1, 3), 16);
  const g2 = parseInt(upper.slice(3, 5), 16);
  const b2 = parseInt(upper.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);

  return `rgb(${r}, ${g}, ${b})`;
}

export function StackTower() {
  const { gameState, highScores, startGame, dropBlock } = useStackTower();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Living Sky State
  const [clouds, setClouds] = useState<Cloud[]>(() => generateClouds());
  const [birds, setBirds] = useState<Bird[]>([]);
  const [planes, setPlanes] = useState<Plane[]>([]);
  const skyAnimationRef = useRef<number | null>(null);
  const lastSkyTimeRef = useRef<number>(0);

  const handleInput = useCallback(() => {
    if (gameState.status === 'idle' || gameState.status === 'gameover') {
      startGame();
    } else if (gameState.status === 'playing') {
      dropBlock();
    }
  }, [gameState.status, startGame, dropBlock]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleInput();
      }
      if (e.code === 'KeyR' && gameState.status === 'gameover') {
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, gameState.status, startGame]);

  // Living Sky Animation Loop
  useEffect(() => {
    const animateSky = (timestamp: number) => {
      if (!lastSkyTimeRef.current) {
        lastSkyTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastSkyTimeRef.current;
      lastSkyTimeRef.current = timestamp;
      const multiplier = deltaTime / 16.67;

      // Update clouds
      setClouds(prevClouds =>
        prevClouds.map(cloud => {
          let newX = cloud.x + cloud.speed * multiplier;
          if (newX > GAME_CONFIG.CANVAS_WIDTH + cloud.width) {
            newX = -cloud.width;
          }
          return { ...cloud, x: newX };
        })
      );

      // Update birds
      setBirds(prevBirds =>
        prevBirds
          .map(bird => {
            const newX = bird.x + bird.speed * bird.direction * multiplier;
            const newWingPhase = bird.wingPhase + 0.15 * multiplier;
            return { ...bird, x: newX, wingPhase: newWingPhase };
          })
          .filter(bird =>
            bird.direction === 1
              ? bird.x < GAME_CONFIG.CANVAS_WIDTH + 50
              : bird.x > -50
          )
      );

      // Update planes
      setPlanes(prevPlanes =>
        prevPlanes
          .map(plane => {
            const newX = plane.x + plane.speed * plane.direction * multiplier;
            return { ...plane, x: newX };
          })
          .filter(plane =>
            plane.direction === 1
              ? plane.x < GAME_CONFIG.CANVAS_WIDTH + 100
              : plane.x > -100
          )
      );

      // Randomly spawn birds (very rarely)
      if (Math.random() < 0.001 * multiplier) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const newBird: Bird = {
          x: direction === 1 ? -20 : GAME_CONFIG.CANVAS_WIDTH + 20,
          y: 80 + Math.random() * 150,
          speed: 0.8 + Math.random() * 0.5,
          wingPhase: Math.random() * Math.PI * 2,
          size: 6 + Math.random() * 4,
          direction,
        };
        setBirds(prev => [...prev, newBird]);
      }

      // Randomly spawn bird flocks (even more rarely)
      if (Math.random() < 0.0003 * multiplier) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const baseY = 60 + Math.random() * 120;
        const baseSpeed = 0.6 + Math.random() * 0.3;
        const flock: Bird[] = [];
        for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
          flock.push({
            x: (direction === 1 ? -20 : GAME_CONFIG.CANVAS_WIDTH + 20) - i * 15 * direction,
            y: baseY + (Math.random() - 0.5) * 20,
            speed: baseSpeed + Math.random() * 0.1,
            wingPhase: Math.random() * Math.PI * 2,
            size: 5 + Math.random() * 3,
            direction,
          });
        }
        setBirds(prev => [...prev, ...flock]);
      }

      // Randomly spawn planes (very rarely)
      if (Math.random() < 0.0002 * multiplier) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const newPlane: Plane = {
          x: direction === 1 ? -80 : GAME_CONFIG.CANVAS_WIDTH + 80,
          y: 40 + Math.random() * 80,
          speed: 0.3 + Math.random() * 0.2,
          size: 8 + Math.random() * 4,
          direction,
        };
        setPlanes(prev => [...prev, newPlane]);
      }

      skyAnimationRef.current = requestAnimationFrame(animateSky);
    };

    skyAnimationRef.current = requestAnimationFrame(animateSky);

    return () => {
      if (skyAnimationRef.current) {
        cancelAnimationFrame(skyAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgColor = interpolateColor(gameState.score);
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);

    // Sky becomes lighter and more open as you build higher
    const heightProgress = Math.min(gameState.score / 100, 1);

    // Top color (based on score)
    gradient.addColorStop(0, bgColor);

    // Middle transition
    const midColor = `rgba(232, 244, 248, ${0.3 + heightProgress * 0.3})`;
    gradient.addColorStop(0.6, midColor);

    // Bottom color - warmer, earthier tone that fades as you go higher
    const bottomWarmth = 1 - heightProgress * 0.5;
    const bottomR = Math.round(232 + 20 * bottomWarmth);
    const bottomG = Math.round(244 - 10 * bottomWarmth);
    const bottomB = Math.round(248 - 20 * bottomWarmth);
    gradient.addColorStop(1, `rgb(${bottomR}, ${bottomG}, ${bottomB})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw Living Sky - Far layer clouds first (behind everything)
    clouds
      .filter(c => c.layer === 0)
      .forEach(cloud => drawCloud(ctx, cloud, heightProgress));

    // Draw distant planes
    planes.forEach(plane => drawPlane(ctx, plane));

    // Draw mid layer clouds
    clouds
      .filter(c => c.layer === 1)
      .forEach(cloud => drawCloud(ctx, cloud, heightProgress));

    // Draw birds
    birds.forEach(bird => drawBird(ctx, bird));

    // Draw close layer clouds (these will be partially covered by tower)
    clouds
      .filter(c => c.layer === 2)
      .forEach(cloud => drawCloud(ctx, cloud, heightProgress));

    const visibleBlocks = 15;
    const cameraOffset = Math.max(
      0,
      (gameState.blocks.length - visibleBlocks) * GAME_CONFIG.BLOCK_HEIGHT
    );

    gameState.blocks.forEach((block) => {
      const y = block.y + cameraOffset;

      if (y > -GAME_CONFIG.BLOCK_HEIGHT && y < GAME_CONFIG.CANVAS_HEIGHT) {
        // Block shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(block.x + 3, y + 3, block.width, GAME_CONFIG.BLOCK_HEIGHT);

        // Block body
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, y, block.width, GAME_CONFIG.BLOCK_HEIGHT);

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(block.x, y, block.width, 4);

        // Bottom shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(block.x, y + GAME_CONFIG.BLOCK_HEIGHT - 3, block.width, 3);
      }
    });

    if (gameState.currentBlock && gameState.status === 'playing') {
      const currentY = GAME_CONFIG.BASE_Y - gameState.blocks.length * GAME_CONFIG.BLOCK_HEIGHT + cameraOffset;
      const color = BLOCK_COLORS[gameState.blocks.length % BLOCK_COLORS.length];

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(
        gameState.currentBlock.x + 4,
        currentY + 4,
        gameState.currentBlock.width,
        GAME_CONFIG.BLOCK_HEIGHT
      );

      ctx.fillStyle = color;
      ctx.fillRect(
        gameState.currentBlock.x,
        currentY,
        gameState.currentBlock.width,
        GAME_CONFIG.BLOCK_HEIGHT
      );

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(
        gameState.currentBlock.x,
        currentY,
        gameState.currentBlock.width,
        5
      );
    }

    gameState.fallingPieces.forEach((piece) => {
      const y = piece.y + cameraOffset;
      if (y < GAME_CONFIG.CANVAS_HEIGHT + 50) {
        ctx.globalAlpha = Math.max(0, 1 - (piece.y - GAME_CONFIG.BASE_Y) / 200);
        ctx.fillStyle = piece.color;
        ctx.fillRect(piece.x, y, piece.width, GAME_CONFIG.BLOCK_HEIGHT);
        ctx.globalAlpha = 1;
      }
    });

    // Perfect Text anzeigen
    if (gameState.showPerfect) {
      const texts = ['PERFECT!', 'WOW!', 'AMAZING!', 'GREAT!'];
      const text = gameState.perfectStreak > 1
        ? `${texts[Math.min(gameState.perfectStreak - 1, texts.length - 1)]} x${gameState.perfectStreak}`
        : 'PERFECT!';

      ctx.save();
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text-Schatten für bessere Lesbarkeit
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Goldener Gradient für den Text
      const gradient = ctx.createLinearGradient(
        GAME_CONFIG.CANVAS_WIDTH / 2 - 80,
        GAME_CONFIG.CANVAS_HEIGHT / 2 - 20,
        GAME_CONFIG.CANVAS_WIDTH / 2 + 80,
        GAME_CONFIG.CANVAS_HEIGHT / 2 + 20
      );
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.5, '#FFF8DC');
      gradient.addColorStop(1, '#FFD700');

      ctx.fillStyle = gradient;
      ctx.fillText(text, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);

      ctx.restore();
    }
  }, [gameState, clouds, birds, planes]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex items-center gap-8 text-center">
        <div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide">Score</div>
          <div className="text-4xl font-bold text-zinc-900">{gameState.score}</div>
        </div>
        <div className="h-12 w-px bg-zinc-200" />
        <div>
          <div className="text-sm text-zinc-500 uppercase tracking-wide">Best</div>
          <div className="text-4xl font-bold text-amber-600">{highScores.best}</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative cursor-pointer select-none"
        onClick={handleInput}
      >
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="rounded-xl shadow-lg border border-zinc-200"
        />

        {gameState.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl">
            <div className="text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Stack Tower</h2>
              <p className="text-lg mb-6 text-white/80">Stapele so hoch wie möglich</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="px-8 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  Klick zum Starten
                </button>
                <span className="text-sm text-white/60">oder Leertaste drücken</span>
              </div>
            </div>
          </div>
        )}

        {gameState.status === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
            <div className="text-white text-center px-6">
              <h2 className="text-2xl font-bold mb-2">Runde vorbei.</h2>
              <div className="text-5xl font-bold mb-2">{gameState.score}</div>
              <p className="text-white/70 mb-1">Blöcke gestapelt</p>
              {gameState.score === highScores.best && gameState.score > 0 && (
                <p className="text-amber-400 font-semibold mb-4">🏆 Neuer Rekord!</p>
              )}
              {gameState.score !== highScores.best && (
                <p className="text-white/50 mb-4">Rekord: {highScores.best}</p>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="px-8 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  Nochmal
                </button>
                <a
                  href="/"
                  className="px-8 py-2.5 text-sm text-white/80 hover:text-white transition-colors"
                >
                  Alle Spiele
                </a>
                <a
                  href="/games/minesweeper/daily"
                  className="px-6 py-2 text-sm text-amber-300 hover:text-amber-200 transition-colors"
                >
                  Heute: Daily spielen
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-zinc-500 text-sm max-w-sm">
        {gameState.status === 'playing' ? (
          <p>Klick oder <kbd className="px-2 py-0.5 bg-zinc-100 rounded text-xs">Space</kbd> zum Platzieren</p>
        ) : (
          <p>
            Stapele die Blöcke präzise aufeinander.
            Je genauer du triffst, desto weniger wird abgeschnitten.
            Perfekte Treffer geben Bonuspunkte!
          </p>
        )}
      </div>

      <div className="flex gap-4 text-xs text-zinc-400">
        <span><kbd className="px-1.5 py-0.5 bg-zinc-100 rounded">Space</kbd> Platzieren</span>
        {gameState.status === 'gameover' && (
          <span><kbd className="px-1.5 py-0.5 bg-zinc-100 rounded">R</kbd> Nochmal</span>
        )}
      </div>
    </div>
  );
}

