import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token, page } = await request.json();

    if (!token || typeof token !== 'string' || token.length > 100) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const sanitizedPage = typeof page === 'string' ? page.slice(0, 200) : null;

    // Don't track admin pages
    if (sanitizedPage?.startsWith('/admin')) {
      return NextResponse.json({ ok: true });
    }

    // Upsert heartbeat
    await prisma.siteHeartbeat.upsert({
      where: { token },
      update: { updatedAt: new Date(), page: sanitizedPage },
      create: { token, page: sanitizedPage },
    });

    // Purge stale entries (older than 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    await prisma.siteHeartbeat.deleteMany({
      where: { updatedAt: { lt: twoMinutesAgo } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
