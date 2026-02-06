import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminHeader from '@/components/admin/AdminHeader';
import LiveVisitorCount from '@/components/admin/LiveVisitorCount';
import LiveGames from '@/components/admin/LiveGames';
import AnalyticsTrendChart from '@/components/admin/AnalyticsTrendChart';

type PlayerVisit = {
  date: string;
  playerId: string;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return toDateKey(date);
}

function aggregateDailyVisitors(...datasets: PlayerVisit[][]) {
  const byDate = new Map<string, Set<string>>();

  for (const dataset of datasets) {
    for (const row of dataset) {
      const visitors = byDate.get(row.date) ?? new Set<string>();
      visitors.add(row.playerId);
      byDate.set(row.date, visitors);
    }
  }

  return byDate;
}

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const oneYearAgo = getDateDaysAgo(364);
  const today = getDateDaysAgo(0);
  const last30Start = getDateDaysAgo(29);
  const previous30Start = getDateDaysAgo(59);
  const previous30End = getDateDaysAgo(30);

  // Purge stale heartbeats before counting
  await prisma.siteHeartbeat.deleteMany({
    where: { updatedAt: { lt: twoMinutesAgo } },
  });

  const [
    liveVisitors,
    activeHeartbeats,
    minesweeperVisits,
    sudokuVisits,
  ] = await Promise.all([
    prisma.siteHeartbeat.count({
      where: { updatedAt: { gte: twoMinutesAgo } },
    }),
    prisma.siteHeartbeat.findMany({
      where: { updatedAt: { gte: twoMinutesAgo } },
      select: { page: true },
    }),
    prisma.dailyAttempt.findMany({
      where: { date: { gte: oneYearAgo } },
      select: { date: true, playerId: true },
    }),
    prisma.dailySudokuAttempt.findMany({
      where: { date: { gte: oneYearAgo } },
      select: { date: true, playerId: true },
    }),
  ]);

  const visitorsByDate = aggregateDailyVisitors(minesweeperVisits, sudokuVisits);

  const dailyTrend = Array.from(visitorsByDate.entries())
    .map(([date, visitors]) => ({
      date,
      visitors: visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayVisitors = visitorsByDate.get(today)?.size ?? 0;

  const visitors30d = dailyTrend
    .filter((point) => point.date >= last30Start)
    .reduce((sum, point) => sum + point.visitors, 0);

  const previous30d = dailyTrend
    .filter((point) => point.date >= previous30Start && point.date <= previous30End)
    .reduce((sum, point) => sum + point.visitors, 0);

  const delta = visitors30d - previous30d;
  const deltaPercent = previous30d > 0
    ? (delta / previous30d) * 100
    : null;
  const average30d = visitors30d / 30;

  // Aggregate live games from heartbeat page paths
  const gamePageCounts: Record<string, number> = {};
  for (const { page } of activeHeartbeats) {
    if (!page?.startsWith('/games/')) continue;
    gamePageCounts[page] = (gamePageCounts[page] || 0) + 1;
  }
  const liveGames = Object.entries(gamePageCounts)
    .map(([page, players]) => ({ page, players }))
    .sort((a, b) => b.players - a.players);

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminHeader active="analytics" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">Analytics</h2>
          <p className="text-sm text-zinc-500 mt-1">
            DSGVO-konform: nur aggregierte, anonyme Besuchsdaten ohne Cookies oder IP-Speicherung.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <LiveVisitorCount initial={liveVisitors} />

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">Besucher heute</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{todayVisitors}</p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">Besucher (30 Tage)</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{visitors30d}</p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">Trend vs. letzte 30 Tage</p>
            <p className={`text-3xl font-bold mt-1 ${
              delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-zinc-900'
            }`}>
              {deltaPercent === null ? 'Neu' : `${delta > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Ø {average30d.toFixed(1)} Besucher/Tag
            </p>
          </div>
        </div>

        <div className="mb-8">
          <AnalyticsTrendChart data={dailyTrend} />
        </div>

        <div className="mb-8">
          <LiveGames initial={liveGames} />
        </div>
      </main>
    </div>
  );
}
