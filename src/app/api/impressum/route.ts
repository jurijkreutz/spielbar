import { NextResponse } from 'next/server';
import { getOrCreateLegalImprint } from '@/lib/legalImprint';

export async function GET() {
  const imprint = await getOrCreateLegalImprint();

  return NextResponse.json({
    companyName: imprint.companyName,
    street: imprint.street,
    postalCode: imprint.postalCode,
    city: imprint.city,
    country: imprint.country,
    email: imprint.email,
    phone: imprint.phone,
    representedBy: imprint.representedBy,
  });
}
