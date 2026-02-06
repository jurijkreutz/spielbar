/**
 * Tests für /api/admin/contact-requests Route
 *
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockPrisma = {
  contactRequest: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/contact-requests/route';
import { PATCH } from '@/app/api/admin/contact-requests/[id]/route';

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/admin/contact-requests/test-id'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/admin/contact-requests', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('liefert Kontaktanfragen sortiert zurück', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.contactRequest.findMany.mockResolvedValue([{ id: '1', status: 'new' }]);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(mockPrisma.contactRequest.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('PATCH /api/admin/contact-requests/:id', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await PATCH(createPatchRequest({ status: 'read' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });
    expect(response.status).toBe(401);
  });

  it('validiert Status', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    const response = await PATCH(createPatchRequest({ status: 'invalid' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });
    expect(response.status).toBe(400);
  });

  it('aktualisiert Status erfolgreich', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.contactRequest.update.mockResolvedValue({ id: 'test-id', status: 'read' });

    const response = await PATCH(createPatchRequest({ status: 'read' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });
    expect(response.status).toBe(200);
    expect(mockPrisma.contactRequest.update).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: { status: 'read' },
    });
  });
});
