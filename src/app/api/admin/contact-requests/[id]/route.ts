import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const status = data?.status;

    if (status !== 'new' && status !== 'read') {
      return NextResponse.json(
        { error: 'Status muss new oder read sein.' },
        { status: 400 }
      );
    }

    const updated = await prisma.contactRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Anfrage.' },
      { status: 500 }
    );
  }
}
