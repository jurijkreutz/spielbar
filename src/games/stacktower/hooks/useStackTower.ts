'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Block, FallingPiece, HighScores } from '../types/stacktower';
import { GAME_CONFIG, BLOCK_COLORS } from '../types/stacktower';

const STORAGE_KEY = 'stacktower-highscores';

function loadHighScores(): HighScores {
  if (typeof window === 'undefined') return { best: 0, lastScore: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { best: 0, lastScore: 0 };
  } catch {
    return { best: 0, lastScore: 0 };
  }
}

function saveHighScores(scores: HighScores) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Ignore storage errors
  }
}

function getBlockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

export function useStackTower() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    blocks: [],
    currentBlock: null,
    fallingPieces: [],
    perfectStreak: 0,
    showPerfect: false,
  });

  const [highScores, setHighScores] = useState<HighScores>({ best: 0, lastScore: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const perfectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load high scores on mount
  useEffect(() => {
    setHighScores(loadHighScores());
  }, []);

  const startGame = useCallback(() => {
    // Clear any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (perfectTimeoutRef.current) {
      clearTimeout(perfectTimeoutRef.current);
    }

    // Create the base block (stationary)
    const baseBlock: Block = {
      x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.INITIAL_BLOCK_WIDTH) / 2,
      width: GAME_CONFIG.INITIAL_BLOCK_WIDTH,
      y: GAME_CONFIG.BASE_Y,
      color: getBlockColor(0),
    };

    setGameState({
      status: 'playing',
      score: 0,
      blocks: [baseBlock],
      currentBlock: {
        x: 0,
        width: GAME_CONFIG.INITIAL_BLOCK_WIDTH,
        direction: 1,
        speed: GAME_CONFIG.INITIAL_SPEED,
      },
      fallingPieces: [],
      perfectStreak: 0,
      showPerfect: false,
    });
  }, []);

  const dropBlock = useCallback(() => {
    setGameState((prev) => {
      if (prev.status !== 'playing' || !prev.currentBlock || prev.blocks.length === 0) {
        return prev;
      }

      const lastBlock = prev.blocks[prev.blocks.length - 1];
      const current = prev.currentBlock;

      // Calculate overlap
      const currentLeft = current.x;
      const currentRight = current.x + current.width;
      const lastLeft = lastBlock.x;
      const lastRight = lastBlock.x + lastBlock.width;

      const overlapLeft = Math.max(currentLeft, lastLeft);
      const overlapRight = Math.min(currentRight, lastRight);
      const overlapWidth = overlapRight - overlapLeft;

      // No overlap = Game Over
      if (overlapWidth <= 0) {
        const newLastScore = prev.score;
        const newBest = Math.max(highScores.best, newLastScore);
        const newScores = { best: newBest, lastScore: newLastScore };
        setHighScores(newScores);
        saveHighScores(newScores);

        return {
          ...prev,
          status: 'gameover',
          currentBlock: null,
        };
      }

      // Check for perfect placement
      const isPerfect = Math.abs(current.x - lastBlock.x) <= GAME_CONFIG.PERFECT_THRESHOLD;

      let newWidth = overlapWidth;
      let newX = overlapLeft;
      const newFallingPieces: FallingPiece[] = [...prev.fallingPieces];

      if (isPerfect) {
        // Perfect! Keep the same width
        newWidth = lastBlock.width;
        newX = lastBlock.x;
      } else {
        // Create falling piece for the cut-off part
        if (currentLeft < lastLeft) {
          // Cut off left side
          newFallingPieces.push({
            x: currentLeft,
            width: lastLeft - currentLeft,
            y: GAME_CONFIG.BASE_Y - prev.blocks.length * GAME_CONFIG.BLOCK_HEIGHT,
            velocityY: 0,
            color: getBlockColor(prev.blocks.length),
            side: 'left',
          });
        }
        if (currentRight > lastRight) {
          // Cut off right side
          newFallingPieces.push({
            x: lastRight,
            width: currentRight - lastRight,
            y: GAME_CONFIG.BASE_Y - prev.blocks.length * GAME_CONFIG.BLOCK_HEIGHT,
            velocityY: 0,
            color: getBlockColor(prev.blocks.length),
            side: 'right',
          });
        }
      }

      // Add new block
      const newBlock: Block = {
        x: newX,
        width: newWidth,
        y: GAME_CONFIG.BASE_Y - prev.blocks.length * GAME_CONFIG.BLOCK_HEIGHT,
        color: getBlockColor(prev.blocks.length),
        perfect: isPerfect,
      };

      const newScore = prev.score + 1 + (isPerfect ? prev.perfectStreak : 0);
      const newPerfectStreak = isPerfect ? prev.perfectStreak + 1 : 0;

      // Show perfect indicator
      if (isPerfect && perfectTimeoutRef.current) {
        clearTimeout(perfectTimeoutRef.current);
      }

      if (isPerfect) {
        perfectTimeoutRef.current = setTimeout(() => {
          setGameState((s) => ({
            ...s,
            showPerfect: false,
          }));
        }, 800);
      }

      // Calculate new speed
      const newSpeed = Math.min(
        GAME_CONFIG.INITIAL_SPEED + prev.blocks.length * GAME_CONFIG.SPEED_INCREMENT,
        GAME_CONFIG.MAX_SPEED
      );

      return {
        ...prev,
        score: newScore,
        blocks: [...prev.blocks, newBlock],
        currentBlock: {
          x: newX, // Start from the new block position
          width: newWidth,
          direction: -current.direction as 1 | -1,
          speed: newSpeed,
        },
        fallingPieces: newFallingPieces,
        perfectStreak: newPerfectStreak,
        showPerfect: isPerfect,
      };
    });
  }, [highScores.best]);

  // Game loop
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Target ~60fps
      const multiplier = deltaTime / 16.67;

      setGameState((prev) => {
        if (prev.status !== 'playing' || !prev.currentBlock) {
          return prev;
        }

        const current = prev.currentBlock;
        let newX = current.x + current.direction * current.speed * multiplier;

        // Bounce off walls
        if (newX <= 0) {
          newX = 0;
          return {
            ...prev,
            currentBlock: { ...current, x: newX, direction: 1 },
          };
        }
        if (newX + current.width >= GAME_CONFIG.CANVAS_WIDTH) {
          newX = GAME_CONFIG.CANVAS_WIDTH - current.width;
          return {
            ...prev,
            currentBlock: { ...current, x: newX, direction: -1 },
          };
        }

        // Update falling pieces
        const updatedFallingPieces = prev.fallingPieces
          .map((piece) => ({
            ...piece,
            y: piece.y + piece.velocityY * multiplier,
            velocityY: piece.velocityY + GAME_CONFIG.GRAVITY * multiplier,
          }))
          .filter((piece) => piece.y < GAME_CONFIG.CANVAS_HEIGHT + 50);

        return {
          ...prev,
          currentBlock: { ...current, x: newX },
          fallingPieces: updatedFallingPieces,
        };
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (perfectTimeoutRef.current) {
        clearTimeout(perfectTimeoutRef.current);
      }
    };
  }, []);

  return {
    gameState,
    highScores,
    startGame,
    dropBlock,
  };
}

