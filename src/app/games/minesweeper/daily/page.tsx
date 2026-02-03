import Link from 'next/link';
import { MinesweeperDailyGame } from '@/games';

export const metadata = {
  title: 'Daily Logic Board | Minesweeper | Spielbar',
  description: 'Das tägliche Minesweeper-Rätsel – garantiert logisch lösbar, ohne Raten.',
};

export default function DailyPage() {
  return (
    <main className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/games/minesweeper"
                className="text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-2"
              >
                ← Zurück zu Minesweeper
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
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <MinesweeperDailyGame />
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="font-bold text-zinc-900 mb-3">Über Daily Logic Boards</h3>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                <span><strong>Garantiert lösbar:</strong> Jedes Board ist rein durch Logik lösbar – kein Raten nötig.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">✓</span>
                <span><strong>Für alle gleich:</strong> Alle Spieler haben exakt dasselbe Rätsel.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">⚠</span>
                <span><strong>Kein Neustart:</strong> Überlege jeden Zug sorgfältig – du hast nur einen Versuch pro Tag.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">💡</span>
                <span><strong>Hinweise:</strong> Du kannst Hilfe nutzen, aber es wird vermerkt.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-zinc-900 text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Spielbar. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </main>
  );
}

