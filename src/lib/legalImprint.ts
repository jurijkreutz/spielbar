import { prisma } from '@/lib/prisma';

export const LEGAL_IMPRINT_ID = 'default';

export const DEFAULT_LEGAL_IMPRINT = {
  id: LEGAL_IMPRINT_ID,
  companyName: 'Spielbar GmbH',
  street: 'Musterstraße 1',
  postalCode: '1010',
  city: 'Wien',
  country: 'Österreich',
  email: 'kontakt@spielbar.at',
  phone: null as string | null,
  representedBy: 'Max Mustermann',
};

export async function getOrCreateLegalImprint() {
  const existing = await prisma.legalImprint.findUnique({
    where: { id: LEGAL_IMPRINT_ID },
  });

  if (existing) {
    return existing;
  }

  return prisma.legalImprint.create({
    data: DEFAULT_LEGAL_IMPRINT,
  });
}
