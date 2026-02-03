import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GameListItem } from '@/components/admin/GameListItem';

export default async function AdminGamesPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const games = await prisma.game.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Admin Header */}
      <header className="bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold">
                Spielbar Admin
              </Link>
              <nav className="hidden md:flex items-center gap-4 ml-8">
                <Link
                  href="/admin"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/games"
                  className="text-white font-medium"
                >
                  Spiele
                </Link>
                <Link
                  href="/admin/news"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  News
                </Link>
              </nav>
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-zinc-400 hover:text-white text-sm"
            >
              Seite ansehen ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">Spiele verwalten</h2>
          <Link
            href="/admin/games/new"
            className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            + Neues Spiel
          </Link>
        </div>

        {games.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
            <p className="text-zinc-600">Noch keine Spiele vorhanden.</p>
            <Link
              href="/admin/games/new"
              className="inline-block mt-4 text-zinc-900 font-medium hover:underline"
            >
              Erstes Spiel anlegen →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Reihenf.
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Spiel
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Badge
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600">
                    Featured
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {games.map((game) => (
                  <GameListItem key={game.id} game={game} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

