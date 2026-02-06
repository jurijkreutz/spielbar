/**
 * Tests für /api/admin/impressum Route
 *
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockGetOrCreateLegalImprint = jest.fn();
const mockPrisma = {
  legalImprint: {
    upsert: jest.fn(),
  },
};

jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/legalImprint', () => ({
  LEGAL_IMPRINT_ID: 'default',
  getOrCreateLegalImprint: () => mockGetOrCreateLegalImprint(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/admin/impressum/route';

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/admin/impressum'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/admin/impressum', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('liefert Impressum mit Auth', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockGetOrCreateLegalImprint.mockResolvedValue({ id: 'default', companyName: 'Spielbar GmbH' });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.companyName).toBe('Spielbar GmbH');
  });
});

describe('PATCH /api/admin/impressum', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await PATCH(createPatchRequest({ companyName: 'Test' }));
    expect(response.status).toBe(401);
  });

  it('validiert Pflichtfelder', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    const response = await PATCH(createPatchRequest({}));
    expect(response.status).toBe(400);
  });

  it('speichert Impressum erfolgreich', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.legalImprint.upsert.mockResolvedValue({ id: 'default', companyName: 'Spielbar GmbH' });

    const response = await PATCH(createPatchRequest({
      companyName: 'Spielbar GmbH',
      street: 'Musterstraße 1',
      postalCode: '1010',
      city: 'Wien',
      country: 'Österreich',
      email: 'kontakt@spielbar.at',
      representedBy: 'Max Mustermann',
    }));

    expect(response.status).toBe(200);
    expect(mockPrisma.legalImprint.upsert).toHaveBeenCalled();
  });
});
