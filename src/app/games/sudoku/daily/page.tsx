import Link from 'next/link';
import { SudokuDailyGame } from '@/games';

export const metadata = {
  title: 'Daily Sudoku | Spielbar',
  description: 'Heute ein Rätsel – morgen das nächste. Ein Sudoku pro Tag, für alle identisch. Kurz starten, kurz denken, fertig.',
};

export default function DailySudokuPage() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium flex items-center gap-2"
              >
                ← Zur Übersicht
              </Link>
            </div>
            <Link href="/" className="flex items-center">
              <img
                src="/spielbar.png"
                alt="Spielbar"
                className="h-8"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Game Area */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
            <SudokuDailyGame />
          </div>
        </div>
      </section>

      {/* Info Section (Ticket 6.4) */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Über Daily Sudoku</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Heute ein Rätsel – morgen das nächste. Ein Sudoku pro Tag, für alle identisch.
              Kurz starten, kurz denken, fertig.
            </p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">📅</span>
                <span><strong>Täglich neu:</strong> Jeden Tag um Mitternacht ein frisches Sudoku.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                <span><strong>Für alle gleich:</strong> Jeder Spieler hat exakt dasselbe Rätsel.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">⏱️</span>
                <span><strong>Zeit & Züge:</strong> Deine Statistiken werden gespeichert.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">🧘</span>
                <span><strong>Kein Stress:</strong> Nimm dir Zeit – es zählt der Spaß am Knobeln.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer with back navigation */}
      <footer className="py-8 bg-zinc-900 text-zinc-400">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Alle Spiele
            </Link>
            <p className="text-sm">© {new Date().getFullYear()} Spielbar. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

