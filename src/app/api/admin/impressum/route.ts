import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrCreateLegalImprint, LEGAL_IMPRINT_ID } from '@/lib/legalImprint';
import { prisma } from '@/lib/prisma';

function requiredField(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} ist erforderlich.`);
  }

  return value.trim();
}

function optionalField(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const imprint = await getOrCreateLegalImprint();
  return NextResponse.json(imprint);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const imprint = await prisma.legalImprint.upsert({
      where: { id: LEGAL_IMPRINT_ID },
      create: {
        id: LEGAL_IMPRINT_ID,
        companyName: requiredField(data?.companyName, 'Firmenname'),
        street: requiredField(data?.street, 'Straße'),
        postalCode: requiredField(data?.postalCode, 'PLZ'),
        city: requiredField(data?.city, 'Ort'),
        country: requiredField(data?.country, 'Land'),
        email: requiredField(data?.email, 'E-Mail'),
        phone: optionalField(data?.phone),
        representedBy: requiredField(data?.representedBy, 'Vertreten durch'),
      },
      update: {
        companyName: requiredField(data?.companyName, 'Firmenname'),
        street: requiredField(data?.street, 'Straße'),
        postalCode: requiredField(data?.postalCode, 'PLZ'),
        city: requiredField(data?.city, 'Ort'),
        country: requiredField(data?.country, 'Land'),
        email: requiredField(data?.email, 'E-Mail'),
        phone: optionalField(data?.phone),
        representedBy: requiredField(data?.representedBy, 'Vertreten durch'),
      },
    });

    return NextResponse.json(imprint);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fehler beim Speichern';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
