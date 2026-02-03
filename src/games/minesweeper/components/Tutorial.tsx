'use client';

import { useState, useCallback, useEffect } from 'react';

export type TutorialStep = {
  id: string;
  title: string;
  content: string;
  highlight?: 'cell' | 'flag' | 'number' | 'timer' | 'reset' | 'difficulty';
  action?: 'click' | 'rightclick' | 'any';
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Minesweeper',
    content: 'Finde alle sicheren Felder, ohne eine Mine zu treffen. Lass uns die Grundlagen lernen!',
    action: 'any',
  },
  {
    id: 'first-click',
    title: 'Dein erster Klick',
    content: 'Klicke auf ein beliebiges Feld. Der erste Klick ist immer sicher!',
    highlight: 'cell',
    action: 'click',
  },
  {
    id: 'numbers',
    title: 'Zahlen verstehen',
    content: 'Zahlen zeigen, wie viele Minen in den 8 angrenzenden Feldern sind. Nutze sie, um Minen zu finden.',
    highlight: 'number',
    action: 'any',
  },
  {
    id: 'flagging',
    title: 'Minen markieren',
    content: 'Rechtsklick setzt eine Flagge, wo du eine Mine vermutest. Probier es aus!',
    highlight: 'flag',
    action: 'rightclick',
  },
  {
    id: 'chord',
    title: 'Schnelles Aufdecken',
    content: 'Wenn eine Zahl genug Flaggen hat, doppelklicke oder Shift+Klick, um alle sicheren Nachbarn aufzudecken.',
    highlight: 'number',
    action: 'any',
  },
  {
    id: 'proof',
    title: 'Proof-Modus',
    content: 'Steckst du fest? Der "Proof"-Button zeigt dir einen logisch beweisbaren Zug – mit Erklärung.',
    highlight: 'cell',
    action: 'any',
  },
  {
    id: 'analysis',
    title: 'Lerne aus Fehlern',
    content: 'Nach jedem Spiel analysieren wir: War es ein Denkfehler oder unvermeidbares Pech?',
    action: 'any',
  },
  {
    id: 'skill-verified',
    title: 'Skill-Verified Runs',
    content: 'Bestzeiten ohne Proof-Hilfe werden als "Skill-Verified" markiert – für echte Meister.',
    highlight: 'timer',
    action: 'any',
  },
  {
    id: 'done',
    title: 'Bereit!',
    content: 'Drücke R für ein neues Spiel. Viel Erfolg!',
    action: 'any',
  },
];

const TUTORIAL_KEY = 'minesweeper-tutorial-completed';

export function useTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Initialize on client-side only to avoid hydration mismatch
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_KEY);
    setIsActive(!tutorialCompleted);
    setIsInitialized(true);
  }, []);

  const currentStep = isActive ? TUTORIAL_STEPS[currentStepIndex] : null;
  const totalSteps = TUTORIAL_STEPS.length;

  const nextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Tutorial complete
      setIsActive(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TUTORIAL_KEY, 'true');
      }
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    }
  }, []);

  const restartTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TUTORIAL_KEY);
    }
  }, []);

  const handleAction = useCallback((action: 'click' | 'rightclick') => {
    if (!currentStep) return;

    // Progress if the action matches or any action is accepted
    if (currentStep.action === 'any' || currentStep.action === action) {
      nextStep();
    }
  }, [currentStep, nextStep]);

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    skipTutorial,
    restartTutorial,
    handleAction,
  };
}

type TutorialOverlayProps = {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
};

export function TutorialOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TutorialOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Tutorial card */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm border border-zinc-200">
          {/* Progress indicator */}
          <div className="flex gap-1 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-zinc-700' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
            {step.content}
          </p>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={onSkip}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              Skip tutorial
            </button>
            <button
              onClick={onNext}
              className="px-4 py-2 bg-zinc-800 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {stepIndex === totalSteps - 1 ? 'Start Playing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type TutorialButtonProps = {
  onClick: () => void;
};

export function TutorialButton({ onClick }: TutorialButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer underline"
      aria-label="Restart tutorial"
    >
      Tutorial
    </button>
  );
}

