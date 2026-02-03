import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const news = await prisma.news.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(news);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validierung
    if (!data.title || !data.slug || !data.content) {
      return NextResponse.json(
        { error: 'Titel, Slug und Inhalt sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfe ob Slug bereits existiert
    const existingNews = await prisma.news.findUnique({
      where: { slug: data.slug },
    });

    if (existingNews) {
      return NextResponse.json(
        { error: 'Eine News mit diesem Slug existiert bereits' },
        { status: 400 }
      );
    }

    const news = await prisma.news.create({
      data: {
        title: data.title,
        slug: data.slug,
        teaser: data.teaser || null,
        content: data.content,
        thumbnail: data.thumbnail || null,
        status: data.status || 'draft',
        pinned: data.pinned || false,
        publishedAt: data.status === 'published' ? new Date() : null,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der News' },
      { status: 500 }
    );
  }
}
