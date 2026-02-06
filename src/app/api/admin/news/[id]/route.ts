import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getPrismaErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }

  return null;
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
    const parsedPublishedAt =
      data.publishedAt !== undefined && data.publishedAt
        ? new Date(data.publishedAt)
        : null;

    if (parsedPublishedAt && Number.isNaN(parsedPublishedAt.getTime())) {
      return NextResponse.json(
        { error: 'Ungültiges Veröffentlichungsdatum' },
        { status: 400 }
      );
    }

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

    const updateData = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.teaser !== undefined && { teaser: data.teaser || null }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.pinned !== undefined && { pinned: data.pinned }),
      ...(data.publishedAt !== undefined && { publishedAt: parsedPublishedAt }),
    };

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Keine Änderungen übermittelt' },
        { status: 400 }
      );
    }

    const news = await prisma.news.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(news);
  } catch (error) {
    const prismaCode = getPrismaErrorCode(error);
    if (prismaCode === 'P2025') {
      return NextResponse.json({ error: 'News nicht gefunden' }, { status: 404 });
    }

    if (prismaCode === 'P2002') {
      return NextResponse.json(
        { error: 'Eine News mit diesem Slug existiert bereits' },
        { status: 400 }
      );
    }

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
    const prismaCode = getPrismaErrorCode(error);
    if (prismaCode === 'P2025') {
      return NextResponse.json({ error: 'News nicht gefunden' }, { status: 404 });
    }

    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der News' },
      { status: 500 }
    );
  }
}
