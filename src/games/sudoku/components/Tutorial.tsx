'use client';

import { TutorialOverlay, TutorialButton, useTutorialBase, type TutorialStep } from '@/components/platform/Tutorial';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Sudoku',
    content: 'Fülle jede Zeile, Spalte und 3×3-Box mit den Zahlen 1–9.',
    action: 'any',
  },
  {
    id: 'select',
    title: 'Zelle wählen',
    content: 'Tippe eine Zelle an, um sie zu markieren.',
    action: 'select',
  },
  {
    id: 'enter',
    title: 'Zahl eingeben',
    content: 'Wähle eine Zahl mit Tastatur oder dem NumberPad.',
    action: 'number',
  },
  {
    id: 'notes',
    title: 'Notizenmodus',
    content: 'Mit N (oder dem Toggle) setzt du Kandidaten als Notizen.',
    action: 'notes',
  },
  {
    id: 'clear',
    title: 'Löschen',
    content: 'Backspace, Delete oder 0 entfernt eine Zahl.',
    action: 'clear',
  },
  {
    id: 'done',
    title: 'Bereit!',
    content: 'Arbeite logisch, und hol dir die Bestzeit.',
    action: 'any',
  },
];

const TUTORIAL_KEY = 'sudoku-tutorial-completed';

export function useTutorial() {
  return useTutorialBase({ steps: TUTORIAL_STEPS, storageKey: TUTORIAL_KEY });
}

export { TutorialOverlay, TutorialButton };
