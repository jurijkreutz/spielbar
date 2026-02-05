'use client';

import { TutorialOverlay, TutorialButton, useTutorialBase, type TutorialStep } from '@/components/platform/Tutorial';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen beim Lemonade Stand',
    content: 'Verdiene Geld, erweitere deinen Stand und werde zur Limonaden-Legende.',
    action: 'any',
  },
  {
    id: 'click',
    title: 'Klicken = Geld',
    content: 'Klicke ins Spielfeld, um Kunden zu bedienen und Geld zu verdienen.',
    action: 'click',
  },
  {
    id: 'upgrades',
    title: 'Upgrades kaufen',
    content: 'Upgrades erhöhen Klickwert, passives Einkommen und Multiplikator.',
    action: 'upgrade',
  },
  {
    id: 'idle',
    title: 'Passives Einkommen',
    content: 'Auch ohne Klicks verdienst du Geld pro Sekunde.',
    action: 'any',
  },
  {
    id: 'achievements',
    title: 'Erfolge sammeln',
    content: 'Schau dir deine Erfolge und Rekorde im 🏆-Menü an.',
    action: 'achievements',
  },
  {
    id: 'done',
    title: 'Bereit!',
    content: 'Optimiere deine Strategie und wachse Schritt für Schritt.',
    action: 'any',
  },
];

const TUTORIAL_KEY = 'lemonadestand-tutorial-completed';

export function useTutorial() {
  return useTutorialBase({ steps: TUTORIAL_STEPS, storageKey: TUTORIAL_KEY });
}

export { TutorialOverlay, TutorialButton };
