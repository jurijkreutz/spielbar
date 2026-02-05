'use client';

import { TutorialOverlay, TutorialButton, useTutorialBase, type TutorialStep } from '@/components/platform/Tutorial';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Stack Tower',
    content: 'Stapele die Blöcke so hoch wie möglich.',
    action: 'any',
  },
  {
    id: 'start',
    title: 'Starten',
    content: 'Klick oder Leertaste startet den Run.',
    action: 'start',
  },
  {
    id: 'drop',
    title: 'Timing',
    content: 'Klick oder Space platziert den Block. Timing ist alles!',
    action: 'drop',
  },
  {
    id: 'perfect',
    title: 'Perfekte Treffer',
    content: 'Perfekte Platzierungen geben Bonuspunkte und halten die Breite.',
    action: 'any',
  },
  {
    id: 'risk',
    title: 'Zu weit daneben',
    content: 'Je ungenauer du bist, desto mehr wird abgeschnitten.',
    action: 'any',
  },
  {
    id: 'restart',
    title: 'Neustart',
    content: 'Bei Game Over drücke R oder klicke auf "Nochmal".',
    action: 'restart',
  },
  {
    id: 'done',
    title: 'Bereit!',
    content: 'Halte den Rhythmus und geh auf Rekordjagd.',
    action: 'any',
  },
];

const TUTORIAL_KEY = 'stacktower-tutorial-completed';

export function useTutorial() {
  return useTutorialBase({ steps: TUTORIAL_STEPS, storageKey: TUTORIAL_KEY });
}

export { TutorialOverlay, TutorialButton };
