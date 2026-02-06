import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  // Purge stale heartbeats before counting
  await prisma.siteHeartbeat.deleteMany({
    where: { updatedAt: { lt: twoMinutesAgo } },
  });

  const [liveVisitors, activeHeartbeats] = await Promise.all([
    prisma.siteHeartbeat.count({
      where: { updatedAt: { gte: twoMinutesAgo } },
    }),
    prisma.siteHeartbeat.findMany({
      where: { updatedAt: { gte: twoMinutesAgo } },
      select: { page: true },
    }),
  ]);

  // Aggregate live games from heartbeat page paths
  const gamePageCounts: Record<string, number> = {};
  for (const { page } of activeHeartbeats) {
    if (!page?.startsWith('/games/')) continue;
    gamePageCounts[page] = (gamePageCounts[page] || 0) + 1;
  }
  const liveGames = Object.entries(gamePageCounts)
    .map(([page, players]) => ({ page, players }))
    .sort((a, b) => b.players - a.players);

  return NextResponse.json({
    liveVisitors,
    liveGames,
  });
}
