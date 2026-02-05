'use client';

import { TutorialOverlay, TutorialButton, useTutorialBase, type TutorialStep } from '@/components/platform/Tutorial';

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
  return useTutorialBase({ steps: TUTORIAL_STEPS, storageKey: TUTORIAL_KEY });
}

export { TutorialOverlay, TutorialButton };
