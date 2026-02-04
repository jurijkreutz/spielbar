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
  const game = await prisma.game.findUnique({
    where: { id },
  });

  if (!game) {
    return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json(game);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    // Validierung wenn relevante Felder vorhanden
    if (data.shortDescription && data.shortDescription.length > 120) {
      return NextResponse.json(
        { error: 'Kurzbeschreibung darf maximal 120 Zeichen haben' },
        { status: 400 }
      );
    }

    // Prüfe ob Slug bereits existiert (wenn geändert)
    if (data.slug) {
      const existingGame = await prisma.game.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existingGame) {
        return NextResponse.json(
          { error: 'Ein Spiel mit diesem Slug existiert bereits' },
          { status: 400 }
        );
      }
    }

    const game = await prisma.$transaction(async (tx) => {
      if (data.homeFeatured === true) {
        await tx.game.updateMany({
          where: { NOT: { id } },
          data: { homeFeatured: false },
        });
      }

      return tx.game.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
          ...(data.longDescription !== undefined && { longDescription: data.longDescription }),
          ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.badge !== undefined && { badge: data.badge || null }),
          ...(data.featured !== undefined && { featured: data.featured }),
          ...(data.homeFeatured !== undefined && { homeFeatured: data.homeFeatured }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.gameComponent !== undefined && { gameComponent: data.gameComponent }),
        },
      });
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Spiels' },
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

    await prisma.game.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Spiels' },
      { status: 500 }
    );
  }
}
