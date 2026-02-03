import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: { id },
  });

  if (!news) {
    return NextResponse.json({ error: 'News nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json(news);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    // Prüfe ob Slug bereits existiert (wenn geändert)
    if (data.slug) {
      const existingNews = await prisma.news.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existingNews) {
        return NextResponse.json(
          { error: 'Eine News mit diesem Slug existiert bereits' },
          { status: 400 }
        );
      }
    }

    const news = await prisma.news.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.teaser !== undefined && { teaser: data.teaser || null }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        ...(data.publishedAt !== undefined && {
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
        }),
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der News' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.news.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der News' },
      { status: 500 }
    );
  }
}

