import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const [gamesCount, newsCount, publishedGames, draftNews] = await Promise.all([
    prisma.game.count(),
    prisma.news.count(),
    prisma.game.count({ where: { status: 'published' } }),
    prisma.news.count({ where: { status: 'draft' } }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Admin Header */}
      <header className="bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Spielbar Admin</h1>
              <nav className="hidden md:flex items-center gap-4 ml-8">
                <Link
                  href="/admin"
                  className="text-zinc-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/games"
                  className="text-zinc-300 hover:text-white transition-colors"
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
            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="text-zinc-400 hover:text-white text-sm"
              >
                Seite ansehen ↗
              </Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/admin/login' });
                }}
              >
                <button
                  type="submit"
                  className="text-zinc-400 hover:text-white text-sm"
                >
                  Abmelden
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Dashboard</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">Spiele gesamt</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{gamesCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">Veröffentlichte Spiele</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {publishedGames}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">News gesamt</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{newsCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">News-Entwürfe</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{draftNews}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">
          Schnellaktionen
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/games/new"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">🎮</div>
            <h4 className="font-semibold text-zinc-900">Neues Spiel anlegen</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Ein neues Spiel zur Plattform hinzufügen
            </p>
          </Link>
          <Link
            href="/admin/news/new"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">📰</div>
            <h4 className="font-semibold text-zinc-900">News schreiben</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Einen neuen News-Beitrag erstellen
            </p>
          </Link>
          <Link
            href="/admin/games"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="font-semibold text-zinc-900">Spiele verwalten</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Reihenfolge, Status und Featured ändern
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}

