// Ticket 6: Neue Spielbeschreibungen (ausführlicher)

export const GAME_DESCRIPTIONS: Record<string, { short: string; long: string }> = {
  minesweeper: {
    short: 'Der Klassiker, der sofort klickt.',
    long: 'Der Klassiker, der sofort klickt. Decke alle sicheren Felder auf, ohne eine Mine zu erwischen – Entscheidungen statt Chaos. Zahlen zeigen dir genau, wo Gefahr ist. Für schnelle Runden oder tiefe Runs.',
  },
  'minesweeper-daily': {
    short: 'Ein Board pro Tag – für alle gleich.',
    long: 'Ein Board pro Tag – für alle gleich. Dieses Rätsel ist ohne Raten lösbar: reine Logik, ein Versuch. Wenn du Hinweise nutzt, wird\'s vermerkt – saubere Solves bleiben etwas Besonderes.',
  },
  sudoku: {
    short: 'Sudoku, wie es sein soll: klar und direkt.',
    long: 'Sudoku, wie es sein soll: klar und direkt. Notizen, Undo/Redo und saubere Eingaben – damit du dich aufs Rätsel konzentrierst. Perfekt für 3 Minuten zwischendurch oder einen längeren Focus-Run.',
  },
  'sudoku-daily': {
    short: 'Heute ein Rätsel – morgen das nächste.',
    long: 'Heute ein Rätsel – morgen das nächste. Ein Sudoku pro Tag, für alle identisch. Kurz starten, kurz denken, fertig.',
  },
  stacktower: {
    short: 'Ein Klick, ein Treffer – und plötzlich bist du drin.',
    long: 'Ein Klick, ein Treffer – und plötzlich bist du drin. Platziere Plattformen, baue Höhe auf, halte die Nerven. Alles, was nicht passt, wird abgeschnitten – simpel, präzise, süchtig machend.',
  },
  'stack-tower': {
    short: 'Ein Klick, ein Treffer – und plötzlich bist du drin.',
    long: 'Ein Klick, ein Treffer – und plötzlich bist du drin. Platziere Plattformen, baue Höhe auf, halte die Nerven. Alles, was nicht passt, wird abgeschnitten – simpel, präzise, süchtig machend.',
  },
  lemonadestand: {
    short: 'Klick, Upgrade, Fortschritt – ohne Stress.',
    long: 'Klick, Upgrade, Fortschritt – ohne Stress. Verkaufe Limonade, investiere smart und sieh zu, wie dein Business wächst. Jeder Schritt fühlt sich nach „mehr" an – und läuft nebenbei weiter.',
  },
  'brick-breaker': {
    short: 'Zen-Arcade Brick Breaker: präzise, ruhig, sofort im Flow.',
    long: 'Zen-Arcade Brick Breaker: ein Paddle, ein Ball, klare Patterns. Fünf kurze Levels mit sanfter Steigerung, kein Zufall. Seltene Powerups geben dir kurz Luft (Multi-Ball, Wider Paddle, Slow), ohne den Rhythmus zu brechen.',
  },
  snake: {
    short: 'Schnell gestartet, schwer zu stoppen.',
    long: 'Schnell gestartet, schwer zu stoppen. Sammle Items, werde länger, bleib sauber in den Kurven. Klassiker-Gefühl, modernes Tempo.',
  },
};

// Helper function to get description by slug
export function getGameDescription(slug: string): { short: string; long: string } | null {
  return GAME_DESCRIPTIONS[slug] || null;
}
