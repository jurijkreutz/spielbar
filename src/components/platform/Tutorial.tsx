'use client';

import { useState, useCallback, useEffect } from 'react';

export type TutorialStep = {
  id: string;
  title: string;
  content: string;
  highlight?: string;
  action?: string;
};

type UseTutorialOptions = {
  steps: TutorialStep[];
  storageKey: string;
  startActive?: boolean;
};

export function useTutorialBase({ steps, storageKey, startActive = true }: UseTutorialOptions) {
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Initialize on client-side only to avoid hydration mismatch
  useEffect(() => {
    const tutorialCompleted =
      typeof window === 'undefined' ? null : localStorage.getItem(storageKey);
    setIsActive(startActive && !tutorialCompleted);
    setIsInitialized(true);
  }, [storageKey, startActive]);

  const currentStep = isActive ? steps[currentStepIndex] : null;
  const totalSteps = steps.length;

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  }, [storageKey]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStepIndex, steps.length, completeTutorial]);

  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  const restartTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const handleAction = useCallback((action: string) => {
    if (!currentStep) return;

    // Progress if the action matches or any action is accepted
    if (!currentStep.action || currentStep.action === 'any' || currentStep.action === action) {
      nextStep();
    }
  }, [currentStep, nextStep]);

  return {
    isActive,
    isInitialized,
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
  className?: string;
};

export function TutorialButton({ onClick, className }: TutorialButtonProps) {
  const defaultTone = className ? '' : 'text-zinc-400 hover:text-zinc-600';
  return (
    <button
      onClick={onClick}
      className={`text-xs transition-colors cursor-pointer underline ${defaultTone} ${className ?? ''}`}
      aria-label="Restart tutorial"
    >
      Tutorial
    </button>
  );
}
