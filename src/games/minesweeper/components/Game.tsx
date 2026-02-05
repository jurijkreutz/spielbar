'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMinesweeper } from '../hooks/useMinesweeper';
import { Board } from './Board';
import { Header } from './Header';
import { useTutorial, TutorialOverlay, TutorialButton } from './Tutorial';
import { PostGameAnalysis, ProofHint } from './ProofMode';
import { ThemeToggle } from '@/components/ThemeContext';
import { findProof, type ProofResult } from '../lib/proofSolver';
import { analytics } from '@/lib/analytics';
import { InfoTooltip } from '@/components/platform/InfoTooltip';
import type { Difficulty, GameConfig, BestTimes } from '../types/minesweeper';
import { DIFFICULTY_CONFIGS } from '../types/minesweeper';

const BEST_TIMES_KEY = 'minesweeper-best-times';
const SKILL_VERIFIED_KEY = 'minesweeper-skill-verified-times';

function loadBestTimes(): BestTimes {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(BEST_TIMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveBestTimes(times: BestTimes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(times));
  } catch {
    // Ignore storage errors
  }
}

function loadSkillVerifiedTimes(): BestTimes {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(SKILL_VERIFIED_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSkillVerifiedTimes(times: BestTimes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SKILL_VERIFIED_KEY, JSON.stringify(times));
  } catch {
    // Ignore storage errors
  }
}

export function Game() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [customConfig, setCustomConfig] = useState<GameConfig>({
    rows: 10,
    cols: 10,
    mines: 15,
  });
  const [bestTimes, setBestTimes] = useState<BestTimes>(() => loadBestTimes());
  const [skillVerifiedTimes, setSkillVerifiedTimes] = useState<BestTimes>(() => loadSkillVerifiedTimes());
  const [hasCheckedWin, setHasCheckedWin] = useState(false);

  // Proof Mode state
  const [usedProofHint, setUsedProofHint] = useState(false);
  const [currentProof, setCurrentProof] = useState<ProofResult | null>(null);
  const [showProofHint, setShowProofHint] = useState(false);
  const [showPostGameAnalysis, setShowPostGameAnalysis] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  const {
    isActive: tutorialActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    skipTutorial,
    restartTutorial,
    handleAction: handleTutorialAction,
  } = useTutorial();

  const config =
    difficulty === 'custom' ? customConfig : DIFFICULTY_CONFIGS[difficulty];

  const {
    board,
    gameState,
    minesRemaining,
    time,
    explodedCell,
    handleCellClick,
    handleCellRightClick,
    handleChordClick,
    resetGame: originalResetGame,
  } = useMinesweeper(config);

  // Find available proof when board changes
  const availableProof = useMemo(() => {
    if (gameState !== 'playing') return null;
    return findProof(board);
  }, [board, gameState]);

  // Track game start when first cell is clicked
  const [gameStartTracked, setGameStartTracked] = useState(false);

  // Reset proof state when game resets
  const resetGame = useCallback(() => {
    analytics.trackGameRestart('minesweeper', 'free');
    originalResetGame();
    setUsedProofHint(false);
    setCurrentProof(null);
    setShowProofHint(false);
    setShowPostGameAnalysis(false);
    setHighlightedCells(new Set());
    setGameStartTracked(false);
  }, [originalResetGame]);

  // Show post-game analysis when game ends
  useEffect(() => {
    if (gameState === 'won' || gameState === 'lost') {
      // Track game end (Ticket 7.1)
      analytics.trackGameEnd('minesweeper', 'free', gameState === 'won' ? 'win' : 'lose', time);

      // Small delay to let the final state render
      const timer = setTimeout(() => {
        setShowPostGameAnalysis(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, time]);

  // Check for new best time on win
  useEffect(() => {
    if (gameState === 'won' && !hasCheckedWin) {
      setHasCheckedWin(true);

      // Update general best time
      const currentBest = bestTimes[difficulty];
      if (currentBest === undefined || time < currentBest) {
        const newBestTimes = { ...bestTimes, [difficulty]: time };
        setBestTimes(newBestTimes);
        saveBestTimes(newBestTimes);
      }

      // Update skill-verified best time (only if no proof hint was used)
      if (!usedProofHint) {
        const currentSkillBest = skillVerifiedTimes[difficulty];
        if (currentSkillBest === undefined || time < currentSkillBest) {
          const newSkillTimes = { ...skillVerifiedTimes, [difficulty]: time };
          setSkillVerifiedTimes(newSkillTimes);
          saveSkillVerifiedTimes(newSkillTimes);
        }
      }
    } else if (gameState !== 'won') {
      setHasCheckedWin(false);
    }
  }, [gameState, difficulty, time, bestTimes, skillVerifiedTimes, hasCheckedWin, usedProofHint]);

  const handleDifficultyChange = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  }, []);

  const handleCustomConfigChange = useCallback((newConfig: GameConfig) => {
    setCustomConfig(newConfig);
  }, []);

  // Proof button handler
  const handleProofRequest = useCallback(() => {
    if (availableProof) {
      setCurrentProof(availableProof);
      setShowProofHint(true);
      setUsedProofHint(true);

      // Highlight involved cells
      const cells = new Set<string>();
      cells.add(`${availableProof.row},${availableProof.col}`);
      if (availableProof.involvedCells) {
        availableProof.involvedCells.forEach(([r, c]) => cells.add(`${r},${c}`));
      }
      setHighlightedCells(cells);

      // Auto-hide after a few seconds
      setTimeout(() => {
        setShowProofHint(false);
        setHighlightedCells(new Set());
      }, 5000);
    }
  }, [availableProof]);

  const closeProofHint = useCallback(() => {
    setShowProofHint(false);
    setHighlightedCells(new Set());
  }, []);

  // Wrap click handlers to also notify tutorial
  const wrappedCellClick = useCallback((row: number, col: number) => {
    // Track game start on first click (Ticket 7.1)
    if (!gameStartTracked && gameState === 'idle') {
      analytics.trackGameStart('minesweeper', 'free', {
        name: 'Minesweeper',
        href: '/games/minesweeper',
      });
      setGameStartTracked(true);
    }
    handleCellClick(row, col);
    handleTutorialAction('click');
    // Clear proof hint when player makes a move
    setShowProofHint(false);
    setHighlightedCells(new Set());
  }, [handleCellClick, handleTutorialAction, gameStartTracked, gameState]);

  const wrappedCellRightClick = useCallback((row: number, col: number) => {
    handleCellRightClick(row, col);
    handleTutorialAction('rightclick');
    setShowProofHint(false);
    setHighlightedCells(new Set());
  }, [handleCellRightClick, handleTutorialAction]);

  // Keyboard shortcut for new game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R' || e.key === 'F2') {
        e.preventDefault();
        resetGame();
      }
      // P key for proof hint
      if ((e.key === 'p' || e.key === 'P') && gameState === 'playing') {
        e.preventDefault();
        handleProofRequest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame, handleProofRequest, gameState]);

  return (
    <div className="flex flex-col items-center">
      <Header
        minesRemaining={minesRemaining}
        time={time}
        gameState={gameState}
        onReset={resetGame}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        customConfig={customConfig}
        onCustomConfigChange={handleCustomConfigChange}
      />

      {/* Proof Button */}
      {gameState === 'playing' && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleProofRequest}
              disabled={!availableProof}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                availableProof
                  ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              } ${usedProofHint ? 'ring-1 ring-amber-400' : ''}`}
              title={availableProof ? 'Zeigt einen logisch beweisbaren Zug (P)' : 'Kein logischer Beweis verfügbar'}
            >
              🔍 Proof {usedProofHint && <span className="text-amber-300 ml-1">•</span>}
            </button>

            {/* Proof Hint Popup */}
            {showProofHint && currentProof && (
              <ProofHint proof={currentProof} onClose={closeProofHint} />
            )}
          </div>
          <InfoTooltip
            tooltipId="minesweeper-proof"
            text="Zeigt dir Züge, die logisch sicher sind."
          />
        </div>
      )}

      <Board
        board={board}
        gameState={gameState}
        onCellClick={wrappedCellClick}
        onCellRightClick={wrappedCellRightClick}
        onChordClick={handleChordClick}
        highlightedCells={highlightedCells}
        proofTargetCell={showProofHint && currentProof ? [currentProof.row, currentProof.col] : undefined}
        proofType={showProofHint && currentProof ? currentProof.type : undefined}
        explodedCell={explodedCell}
      />

      <div className="mt-6 text-sm text-zinc-500">
        {/* Best times display */}
        <div className="flex gap-4 justify-center">
          {bestTimes[difficulty] !== undefined && (
            <p>
              Bestzeit:{' '}
              <span className="font-mono font-bold text-zinc-700">
                {bestTimes[difficulty]}s
              </span>
            </p>
          )}
          {skillVerifiedTimes[difficulty] !== undefined && (
            <p className="text-green-600">
              ✓ Skill-Verified:{' '}
              <span className="font-mono font-bold">
                {skillVerifiedTimes[difficulty]}s
              </span>
            </p>
          )}
        </div>

        {/* Game state messages */}
        {gameState === 'won' && !showPostGameAnalysis && (
          <p className="text-green-600 font-medium mt-2">
            🎉 Gewonnen in {time} Sekunden!
          </p>
        )}
        {gameState === 'lost' && !showPostGameAnalysis && (
          <p className="text-red-600 font-medium mt-2">
            💥 Game Over! Drücke R für ein neues Spiel.
          </p>
        )}

        {/* Proof mode indicator */}
        {usedProofHint && gameState === 'playing' && (
          <p className="text-amber-600 text-xs mt-2">
            Proof-Hilfe genutzt – kein Skill-Verified Run
          </p>
        )}
      </div>

      <div className="mt-8 text-xs text-zinc-400 text-center max-w-md">
        <p>Linksklick = aufdecken • Rechtsklick = Flagge • Doppelklick auf Zahlen = Chording</p>
        <p className="mt-1">
          R = Neues Spiel • P = Proof-Hinweis
          {!tutorialActive && (
            <>
              {' • '}
              <TutorialButton onClick={restartTutorial} />
            </>
          )}
        </p>
        <div className="mt-3 flex justify-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Tutorial Overlay */}
      {tutorialActive && currentStep && (
        <TutorialOverlay
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onSkip={skipTutorial}
        />
      )}

      {/* Post-Game Analysis Modal */}
      {showPostGameAnalysis && (gameState === 'won' || gameState === 'lost') && (
        <PostGameAnalysis
          board={board}
          gameState={gameState}
          explodedCell={explodedCell}
          time={time}
          usedProofHint={usedProofHint}
          onClose={() => setShowPostGameAnalysis(false)}
          onNewGame={resetGame}
        />
      )}
    </div>
  );
}
