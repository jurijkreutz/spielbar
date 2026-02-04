'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSnake } from '../hooks/useSnake';
import { GAME_CONFIG, COLORS, SPECIAL_ITEMS } from '../types/snake';
import type { SnakeSegment, Particle, ActiveEffect } from '../types/snake';

// Helper to draw rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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

// Interpolate between colors
function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Format time in mm:ss
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function Snake() {
  const {
    gameState,
    highScores,
    lastRunStats,
    startGame,
    changeDirection,
    togglePause,
  } = useSnake();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const drawFnRef = useRef<((timestamp: number) => void) | null>(null);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key, 'Status:', gameState.status);

      // R key for restart (Ticket 4.2)
      if ((e.key === 'r' || e.key === 'R') && gameState.status === 'gameover') {
        e.preventDefault();
        startGame();
        return;
      }

      if (gameState.status === 'idle' || gameState.status === 'gameover') {
        if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.code === 'Escape' || e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (gameState.status !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          console.log('Changing direction to UP');
          changeDirection('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          console.log('Changing direction to DOWN');
          changeDirection('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          console.log('Changing direction to LEFT');
          changeDirection('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          console.log('Changing direction to RIGHT');
          changeDirection('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, startGame, changeDirection, togglePause]);

  // Touch controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (gameState.status === 'idle' || gameState.status === 'gameover') {
        startGame();
        return;
      }

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState.status !== 'playing') return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      const minSwipe = 30;
      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'right' : 'left');
      } else {
        changeDirection(dy > 0 ? 'down' : 'up');
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState.status, startGame, changeDirection]);

  // Draw game
  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { snake, food, specialItem, particles, activeEffects, combo, showComboText, riskZone, cameraState, inRiskZone } = gameState;
    const isGhost = activeEffects.some((e) => e.type === 'ghost');

    // Default camera state if not defined (for backwards compatibility)
    const camera = cameraState ?? {
      zoom: 1.0,
      targetZoom: 1.0,
      offsetX: 0,
      offsetY: 0,
      shake: 0,
      intensity: 0,
      nearMissTimer: 0,
    };

    // Clear
    ctx.fillStyle = COLORS.BG_DARK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform (Flow Camera)
    ctx.save();

    // Calculate camera center offset for zoom
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Apply screen shake
    const shakeX = camera.shake * (Math.random() - 0.5) * 2;
    const shakeY = camera.shake * (Math.random() - 0.5) * 2;

    // Apply zoom and shake transformation
    ctx.translate(centerX + shakeX, centerY + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-centerX, -centerY);

    // Apply intensity vignette effect (drawn as overlay later)
    const intensityValue = camera.intensity;

    // Draw subtle grid with parallax effect
    const parallaxOffset = (timestamp * 0.01) % GAME_CONFIG.CELL_SIZE;
    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth = 1;

    for (let x = -GAME_CONFIG.CELL_SIZE; x <= canvas.width + GAME_CONFIG.CELL_SIZE; x += GAME_CONFIG.CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + parallaxOffset * 0.3, 0);
      ctx.lineTo(x + parallaxOffset * 0.3, canvas.height);
      ctx.stroke();
    }

    for (let y = -GAME_CONFIG.CELL_SIZE; y <= canvas.height + GAME_CONFIG.CELL_SIZE; y += GAME_CONFIG.CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + parallaxOffset * 0.3);
      ctx.lineTo(canvas.width, y + parallaxOffset * 0.3);
      ctx.stroke();
    }

    // Draw particles
    particles.forEach((p: Particle) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Risk Zone
    if (riskZone) {
      const rzX = riskZone.x * GAME_CONFIG.CELL_SIZE;
      const rzY = riskZone.y * GAME_CONFIG.CELL_SIZE;
      const rzW = riskZone.width * GAME_CONFIG.CELL_SIZE;
      const rzH = riskZone.height * GAME_CONFIG.CELL_SIZE;

      // Check if snake head is in risk zone
      const head = snake[0];
      const headInZone = head.x >= riskZone.x && head.x < riskZone.x + riskZone.width &&
                         head.y >= riskZone.y && head.y < riskZone.y + riskZone.height;

      // Calculate remaining time for visual pulse
      const elapsed = Date.now() - riskZone.spawnTime;
      const remaining = riskZone.duration - elapsed;
      const pulsePhase = Math.sin(timestamp * 0.008) * 0.5 + 0.5;

      // Fade out warning when time is running low
      const fadeOut = remaining < 2000 ? remaining / 2000 : 1;
      const flickerEffect = remaining < 2000 ? Math.sin(timestamp * 0.03) * 0.3 + 0.7 : 1;

      // Intensity boost when snake is inside
      const activeBoost = headInZone ? 1.5 : 1.0;

      // Background glow (stronger when inside)
      const gradient = ctx.createRadialGradient(
        rzX + rzW / 2, rzY + rzH / 2, 0,
        rzX + rzW / 2, rzY + rzH / 2, Math.max(rzW, rzH)
      );
      gradient.addColorStop(0, `rgba(255, 51, 102, ${0.15 * fadeOut * flickerEffect * activeBoost})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(rzX - 20, rzY - 20, rzW + 40, rzH + 40);

      // Zone background with pulse (more visible when inside)
      const bgAlpha = headInZone ? (0.1 + pulsePhase * 0.1) : (0.05 + pulsePhase * 0.05);
      ctx.fillStyle = `rgba(255, 51, 102, ${bgAlpha * fadeOut * flickerEffect})`;
      roundRect(ctx, rzX, rzY, rzW, rzH, 8);
      ctx.fill();

      // Zone border with animated dash (golden when inside!)
      ctx.save();
      if (headInZone) {
        if (inRiskZone) {
          // TRAPPED! Red pulsing border - leaving means death!
          const dangerPulse = Math.sin(timestamp * 0.02) * 0.3 + 0.7;
          ctx.strokeStyle = `rgba(255, 0, 0, ${dangerPulse * fadeOut})`;
          ctx.lineWidth = 4;
        } else {
          // Golden border when active - you're earning bonus!
          ctx.strokeStyle = `rgba(255, 204, 0, ${(0.6 + pulsePhase * 0.3) * fadeOut})`;
          ctx.lineWidth = 3;
        }
      } else {
        ctx.strokeStyle = `rgba(255, 51, 102, ${(0.4 + pulsePhase * 0.2) * fadeOut * flickerEffect})`;
        ctx.lineWidth = 2;
      }
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -timestamp * 0.05;
      roundRect(ctx, rzX, rzY, rzW, rzH, 8);
      ctx.stroke();
      ctx.restore();

      // Corner accents (red when trapped, golden when just inside, pink otherwise)
      const cornerSize = 12;
      if (inRiskZone && headInZone) {
        // TRAPPED - red corners
        const dangerPulse = Math.sin(timestamp * 0.02) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 0, 0, ${dangerPulse * fadeOut})`;
      } else if (headInZone) {
        ctx.strokeStyle = `rgba(255, 204, 0, ${0.9 * fadeOut})`;
      } else {
        ctx.strokeStyle = `rgba(255, 51, 102, ${0.8 * fadeOut * flickerEffect})`;
      }
      ctx.lineWidth = 3;
      ctx.setLineDash([]);

      // Top-left
      ctx.beginPath();
      ctx.moveTo(rzX, rzY + cornerSize);
      ctx.lineTo(rzX, rzY);
      ctx.lineTo(rzX + cornerSize, rzY);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(rzX + rzW - cornerSize, rzY);
      ctx.lineTo(rzX + rzW, rzY);
      ctx.lineTo(rzX + rzW, rzY + cornerSize);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(rzX, rzY + rzH - cornerSize);
      ctx.lineTo(rzX, rzY + rzH);
      ctx.lineTo(rzX + cornerSize, rzY + rzH);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(rzX + rzW - cornerSize, rzY + rzH);
      ctx.lineTo(rzX + rzW, rzY + rzH);
      ctx.lineTo(rzX + rzW, rzY + rzH - cornerSize);
      ctx.stroke();

      // Multiplier indicator
      const indicatorPulse = 1 + Math.sin(timestamp * 0.01) * 0.2;

      if (headInZone) {
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textX = rzX + rzW / 2;
        const textY = rzY - 12;

        if (inRiskZone) {
          // TRAPPED! Show warning - can't leave!
          const dangerPulse = Math.sin(timestamp * 0.015) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255, 0, 0, ${dangerPulse * fadeOut})`;
          ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
          ctx.shadowBlur = 15;
          ctx.fillText('☠ ×3', textX, textY);
        } else {
          // First frame inside - show bonus only
          ctx.fillStyle = `rgba(255, 204, 0, ${0.9 * fadeOut})`;
          ctx.shadowColor = 'rgba(255, 204, 0, 0.8)';
          ctx.shadowBlur = 10;
          ctx.fillText('×3', textX, textY);
        }
        ctx.restore();
      } else {
        // Just show small indicator dot when not inside
        ctx.fillStyle = `rgba(255, 204, 0, ${0.6 * fadeOut * flickerEffect})`;
        ctx.beginPath();
        ctx.arc(rzX + rzW - 8, rzY + 8, 4 * indicatorPulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw food with glow and pulse
    const pulse = 1 + Math.sin(timestamp * 0.005) * 0.1;
    const foodX = food.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const foodY = food.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
    const foodRadius = (GAME_CONFIG.CELL_SIZE / 2 - 2) * pulse;

    // Glow
    const gradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, foodRadius * 2);
    gradient.addColorStop(0, COLORS.FOOD_GLOW);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Food
    ctx.fillStyle = COLORS.FOOD_PRIMARY;
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(foodX - 2, foodY - 2, foodRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw special item
    if (specialItem) {
      const si = specialItem;
      const siX = si.position.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const siY = si.position.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const siPulse = 1 + Math.sin(timestamp * 0.008) * 0.15;
      const siRadius = (GAME_CONFIG.CELL_SIZE / 2 - 1) * siPulse;
      const siColor = SPECIAL_ITEMS[si.type].color;

      // Glow
      const siGradient = ctx.createRadialGradient(siX, siY, 0, siX, siY, siRadius * 2.5);
      siGradient.addColorStop(0, siColor + '80');
      siGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = siGradient;
      ctx.beginPath();
      ctx.arc(siX, siY, siRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Item
      ctx.fillStyle = siColor;
      ctx.beginPath();
      ctx.arc(siX, siY, siRadius, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.font = `${GAME_CONFIG.CELL_SIZE * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SPECIAL_ITEMS[si.type].icon, siX, siY);
    }

    // Draw snake
    const snakeLength = snake.length;
    snake.forEach((segment: SnakeSegment, index: number) => {
      const t = index / Math.max(1, snakeLength - 1);
      const color = lerpColor(COLORS.SNAKE_HEAD, COLORS.SNAKE_TAIL, t);
      const segmentSize = GAME_CONFIG.CELL_SIZE - 2 - t * 2;
      const x = segment.x * GAME_CONFIG.CELL_SIZE + (GAME_CONFIG.CELL_SIZE - segmentSize) / 2;
      const y = segment.y * GAME_CONFIG.CELL_SIZE + (GAME_CONFIG.CELL_SIZE - segmentSize) / 2;

      ctx.globalAlpha = isGhost ? 0.4 : 1;

      // Head glow
      if (index === 0) {
        const headX = segment.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
        const headY = segment.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
        const glowGradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, GAME_CONFIG.CELL_SIZE);
        glowGradient.addColorStop(0, COLORS.SNAKE_GLOW);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(headX, headY, GAME_CONFIG.CELL_SIZE, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = color;
      roundRect(ctx, x, y, segmentSize, segmentSize, 4);
      ctx.fill();

      // Eye on head
      if (index === 0) {
        ctx.fillStyle = COLORS.BG_DARK;
        const eyeOffset = GAME_CONFIG.CELL_SIZE * 0.15;
        const eyeSize = GAME_CONFIG.CELL_SIZE * 0.12;
        const headCenterX = segment.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
        const headCenterY = segment.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;

        // Position eyes based on direction
        let eye1X = headCenterX, eye1Y = headCenterY;
        let eye2X = headCenterX, eye2Y = headCenterY;

        switch (gameState.direction) {
          case 'right':
            eye1X = headCenterX + eyeOffset; eye1Y = headCenterY - eyeOffset * 1.2;
            eye2X = headCenterX + eyeOffset; eye2Y = headCenterY + eyeOffset * 1.2;
            break;
          case 'left':
            eye1X = headCenterX - eyeOffset; eye1Y = headCenterY - eyeOffset * 1.2;
            eye2X = headCenterX - eyeOffset; eye2Y = headCenterY + eyeOffset * 1.2;
            break;
          case 'up':
            eye1X = headCenterX - eyeOffset * 1.2; eye1Y = headCenterY - eyeOffset;
            eye2X = headCenterX + eyeOffset * 1.2; eye2Y = headCenterY - eyeOffset;
            break;
          case 'down':
            eye1X = headCenterX - eyeOffset * 1.2; eye1Y = headCenterY + eyeOffset;
            eye2X = headCenterX + eyeOffset * 1.2; eye2Y = headCenterY + eyeOffset;
            break;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    });

    // Draw combo text
    if (showComboText && combo > 1) {
      ctx.save();
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLORS.COMBO_TEXT;
      ctx.shadowColor = COLORS.COMBO_TEXT;
      ctx.shadowBlur = 20;
      ctx.fillText(`x${combo}`, canvas.width / 2, 50);
      ctx.restore();
    }

    // Draw active effects indicator
    if (activeEffects.length > 0) {
      ctx.save();
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      activeEffects.forEach((effect: ActiveEffect, i: number) => {
        const info = SPECIAL_ITEMS[effect.type];
        const remaining = Math.ceil((effect.endTime - Date.now()) / 1000);
        ctx.fillStyle = info.color;
        ctx.fillText(`${info.icon} ${remaining}s`, 10, 10 + i * 20);
      });
      ctx.restore();
    }

    // Restore camera transform
    ctx.restore();

    // Draw intensity vignette overlay (after camera transform restored)
    if (intensityValue > 0.1) {
      const vignetteGradient = ctx.createRadialGradient(
        centerX, centerY, canvas.width * 0.3,
        centerX, centerY, canvas.width * 0.7
      );
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(1, `rgba(255, 51, 102, ${intensityValue * 0.15})`);
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (drawFnRef.current) {
      animationRef.current = requestAnimationFrame(drawFnRef.current);
    }
  }, [gameState]);

  // Store draw function in ref
  useEffect(() => {
    drawFnRef.current = draw;
  }, [draw]);

  // Start render loop
  useEffect(() => {
    if (drawFnRef.current) {
      animationRef.current = requestAnimationFrame(drawFnRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate speed percentage
  const speedPercent = useMemo(() => {
    const range = GAME_CONFIG.INITIAL_SPEED - GAME_CONFIG.MIN_SPEED;
    const current = GAME_CONFIG.INITIAL_SPEED - gameState.speed;
    return Math.round((current / range) * 100);
  }, [gameState.speed]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] p-4">
      {/* Score Display */}
      <div className="mb-4 text-center">
        <div className="text-4xl font-bold text-white mb-1">{gameState.score}</div>
        <div className="text-sm text-white/60">
          Best: {highScores.best}
        </div>
      </div>

      {/* Game Container */}
      <div
        ref={containerRef}
        className="relative touch-none select-none"
        style={{ width: GAME_CONFIG.CANVAS_WIDTH, height: GAME_CONFIG.CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="rounded-lg border border-white/10"
        />

        {/* Idle Overlay */}
        {gameState.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h1 className="text-4xl font-bold text-[#00ff88] mb-4">SNAKE</h1>
            <p className="text-white/60 mb-8">Modern Classic</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00cc6a] transition-colors"
            >
              Play
            </button>
            <p className="text-white/40 text-sm mt-4">
              Press SPACE or tap to start
            </p>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState.status === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h2 className="text-3xl font-bold text-white mb-4">PAUSED</h2>
            <button
              onClick={togglePause}
              className="px-8 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00cc6a] transition-colors"
            >
              Resume
            </button>
            <p className="text-white/40 text-sm mt-4">
              Press ESC or P to continue
            </p>
          </div>
        )}

        {/* Game Over Overlay (Ticket 4.1 - Konsistente Endstates) */}
        {gameState.status === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-[#ff3366] mb-2">Runde vorbei.</h2>
            <div className="text-5xl font-bold text-white mb-4">{gameState.score}</div>

            {lastRunStats && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
                <div className="text-white/60">Time:</div>
                <div className="text-white">{formatTime(lastRunStats.survivalTime)}</div>
                <div className="text-white/60">Max Length:</div>
                <div className="text-white">{lastRunStats.maxLength}</div>
                <div className="text-white/60">Max Combo:</div>
                <div className="text-white">{lastRunStats.maxCombo}x</div>
                <div className="text-white/60">Top Speed:</div>
                <div className="text-white">{Math.round((GAME_CONFIG.INITIAL_SPEED - lastRunStats.maxSpeed) / (GAME_CONFIG.INITIAL_SPEED - GAME_CONFIG.MIN_SPEED) * 100)}%</div>
                {lastRunStats.riskZoneScore > 0 && (
                  <>
                    <div className="text-[#ff3366]/80">Risk Bonus:</div>
                    <div className="text-[#ff3366]">+{lastRunStats.riskZoneScore}</div>
                  </>
                )}
              </div>
            )}

            {gameState.score >= highScores.best && gameState.score > 0 && (
              <div className="text-[#ffcc00] font-bold mb-4 animate-pulse">
                🏆 NEW HIGH SCORE!
              </div>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={startGame}
                className="px-8 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00cc6a] transition-colors"
              >
                Nochmal
              </button>
              <a
                href="/"
                className="px-8 py-2.5 text-center text-white/70 hover:text-white transition-colors"
              >
                Alle Spiele
              </a>
              <a
                href="/games/minesweeper/daily"
                className="px-6 py-2 text-center text-amber-400 hover:text-amber-300 transition-colors text-sm"
              >
                Heute: Daily spielen
              </a>
            </div>
            <p className="text-white/40 text-sm mt-4">
              Drücke <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">R</kbd> für Neustart
            </p>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {gameState.status === 'playing' && (
        <div className="mt-4 flex gap-8 text-sm text-white/60">
          <div>
            Length: <span className="text-white">{gameState.snake.length}</span>
          </div>
          <div>
            Speed: <span className="text-white">{speedPercent}%</span>
          </div>
          <div>
            Time: <span className="text-white">{formatTime(gameState.survivalTime)}</span>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="mt-6 text-white/30 text-xs text-center">
        <p>Arrow keys or WASD to move • ESC to pause</p>
        <p className="mt-1">On mobile: Swipe to change direction</p>
      </div>
    </div>
  );
}

