import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MinesweeperGame, SudokuGame, StackTower, Snake, LemonadeStand } from '@/games';
import { GAME_DESCRIPTIONS } from '@/lib/gameDescriptions';

// Mapping von gameComponent zu tatsächlichen Komponenten
const gameComponents: Record<string, React.ComponentType> = {
  Minesweeper: MinesweeperGame,
  Sudoku: SudokuGame,
  StackTower: StackTower,
  Snake: Snake,
  LemonadeStand: LemonadeStand,
};

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({
    where: { slug },
  });

  if (!game) {
    return { title: 'Spiel nicht gefunden | Spielbar' };
  }

  // Use new descriptions
  const descriptions = GAME_DESCRIPTIONS[game.slug];
  const shortDesc = descriptions?.short || game.shortDescription;

  return {
    title: `${game.name} | Spielbar`,
    description: shortDesc,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({
    where: { slug, status: 'published' },
  });

  if (!game) {
    notFound();
  }

  const GameComponent = gameComponents[game.gameComponent];

  // Get descriptions from constants, fallback to database
  const descriptions = GAME_DESCRIPTIONS[game.slug];
  const shortDesc = descriptions?.short || game.shortDescription;
  const longDesc = descriptions?.long || game.longDescription;

  return (
    <main className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-2"
            >
              ← Zur Übersicht
            </Link>
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

      {/* Game Info */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {game.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                    {game.badge}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-zinc-900">{game.name}</h1>
              <p className="mt-2 text-zinc-600">{shortDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Board Banner - für Minesweeper */}
      {game.slug === 'minesweeper' && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link
              href="/games/minesweeper/daily"
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">
                  📅 DAILY
                </span>
                <div>
                  <p className="font-semibold text-zinc-900 group-hover:text-amber-700 transition-colors">
                    Tägliches Logic Board
                  </p>
                  <p className="text-sm text-zinc-600">
                    Garantiert lösbar ohne Raten • Ein Versuch pro Tag
                  </p>
                </div>
              </div>
              <span className="text-amber-600 font-medium group-hover:translate-x-1 transition-transform">
                Spielen →
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Daily Sudoku Banner - für Sudoku */}
      {game.slug === 'sudoku' && (
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link
              href="/games/sudoku/daily"
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded-full">
                  📅 DAILY
                </span>
                <div>
                  <p className="font-semibold text-zinc-900 group-hover:text-blue-700 transition-colors">
                    Tägliches Sudoku
                  </p>
                  <p className="text-sm text-zinc-600">
                    Jeden Tag ein neues Rätsel • Gleich für alle Spieler
                  </p>
                </div>
              </div>
              <span className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                Spielen →
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Game Area */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {GameComponent ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <GameComponent />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
              <p className="text-zinc-600">
                Dieses Spiel ist noch nicht verfügbar.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Game Description (Ticket 6) */}
      {longDesc && (
        <section className="py-8 bg-white border-t border-zinc-200">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Über {game.name}
            </h2>
            <p className="text-zinc-600 leading-relaxed">
              {longDesc}
            </p>
          </div>
        </section>
      )}

      {/* Footer with back navigation (Ticket 8 - keine Sackgassen) */}
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
