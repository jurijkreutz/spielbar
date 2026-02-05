import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validierung
    if (!data.name || !data.slug || !data.shortDescription || !data.gameComponent) {
      return NextResponse.json(
        { error: 'Name, Slug, Kurzbeschreibung und Game Component sind erforderlich' },
        { status: 400 }
      );
    }

    if (data.shortDescription.length > 120) {
      return NextResponse.json(
        { error: 'Kurzbeschreibung darf maximal 120 Zeichen haben' },
        { status: 400 }
      );
    }

    // Prüfe ob Slug bereits existiert
    const existingGame = await prisma.game.findUnique({
      where: { slug: data.slug },
    });

    if (existingGame) {
      return NextResponse.json(
        { error: 'Ein Spiel mit diesem Slug existiert bereits' },
        { status: 400 }
      );
    }

    const game = await prisma.$transaction(async (tx) => {
      if (data.homeFeatured) {
        await tx.game.updateMany({ data: { homeFeatured: false } });
      }

      return tx.game.create({
        data: {
          name: data.name,
          slug: data.slug,
          shortDescription: data.shortDescription,
          longDescription: data.longDescription || null,
          thumbnail: data.thumbnail || null,
          continueBackground: data.continueBackground || null,
          status: data.status || 'draft',
          badge: data.badge || null,
          featured: data.featured || false,
          homeFeatured: data.homeFeatured || false,
          sortOrder: data.sortOrder || 0,
          gameComponent: data.gameComponent,
        },
      });
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spiels' },
      { status: 500 }
    );
  }
}
