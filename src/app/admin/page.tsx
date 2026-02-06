import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';


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
      <AdminHeader active="dashboard" />

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
          <Link
            href="/admin/analytics"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-zinc-900">Analytics</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Live-Besucher und Spiel-Statistiken ansehen
            </p>
          </Link>
          <Link
            href="/admin/legal"
            className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">⚖️</div>
            <h4 className="font-semibold text-zinc-900">Recht & Kontakt</h4>
            <p className="text-sm text-zinc-500 mt-1">
              Impressum pflegen und Kontaktanfragen bearbeiten
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
