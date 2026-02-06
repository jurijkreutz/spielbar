import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (typeof data?.honeypot === 'string' && data.honeypot.trim()) {
      return NextResponse.json({ success: true });
    }

    const message = normalizeOptionalString(data?.message, 3000);
    const email = normalizeOptionalString(data?.email, 254);
    const name = normalizeOptionalString(data?.name, 120);
    const sourcePath = normalizeOptionalString(data?.sourcePath, 200);
    const sourceContext = normalizeOptionalString(data?.sourceContext, 200);

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: 'Nachricht muss mindestens 10 Zeichen enthalten.' },
        { status: 400 }
      );
    }

    if (!sourcePath) {
      return NextResponse.json(
        { error: 'Quelle ist erforderlich.' },
        { status: 400 }
      );
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse ist ungültig.' },
        { status: 400 }
      );
    }

    await prisma.contactRequest.create({
      data: {
        name,
        email,
        message,
        sourcePath,
        sourceContext,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Fehler beim Senden der Anfrage.' },
      { status: 500 }
    );
  }
}
