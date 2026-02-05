'use client';

import { TutorialOverlay, TutorialButton, useTutorialBase, type TutorialStep } from '@/components/platform/Tutorial';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Snake',
    content: 'Steuere die Schlange, sammle Futter und vermeide Kollisionen.',
    action: 'any',
  },
  {
    id: 'start',
    title: 'Spiel starten',
    content: 'Drücke SPACE oder tippe auf das Spielfeld, um zu beginnen.',
    action: 'start',
  },
  {
    id: 'move',
    title: 'Bewegen',
    content: 'Nutze Pfeiltasten oder WASD. Auf Mobile: wischen.',
    action: 'move',
  },
  {
    id: 'food',
    title: 'Futter & Score',
    content: 'Jedes Futter erhöht deinen Score und lässt die Schlange wachsen.',
    action: 'score',
  },
  {
    id: 'pause',
    title: 'Pause',
    content: 'ESC oder P pausiert das Spiel, nochmal drücken zum Fortsetzen.',
    action: 'pause',
  },
  {
    id: 'done',
    title: 'Bereit!',
    content: 'Bleib weg von Wänden und dir selbst. Viel Erfolg!',
    action: 'any',
  },
];

const TUTORIAL_KEY = 'snake-tutorial-completed';

export function useTutorial() {
  return useTutorialBase({ steps: TUTORIAL_STEPS, storageKey: TUTORIAL_KEY });
}

export { TutorialOverlay, TutorialButton };
