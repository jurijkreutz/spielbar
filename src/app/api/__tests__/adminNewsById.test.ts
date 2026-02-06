/**
 * Tests für /api/admin/news/[id] Route
 *
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockPrisma = {
  news: {
    update: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '@/app/api/admin/news/[id]/route';

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/admin/news/test-id'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function createDeleteRequest() {
  return new NextRequest(new URL('http://localhost:3000/api/admin/news/test-id'), {
    method: 'DELETE',
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PATCH /api/admin/news/:id', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(createPatchRequest({ title: 'Test' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });

    expect(response.status).toBe(401);
  });

  it('validiert publishedAt', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });

    const response = await PATCH(createPatchRequest({ publishedAt: 'not-a-date' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });

    expect(response.status).toBe(400);
    expect(mockPrisma.news.update).not.toHaveBeenCalled();
  });

  it('gibt 404 zurück wenn News nicht gefunden wird', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.update.mockRejectedValue({ code: 'P2025' });

    const response = await PATCH(createPatchRequest({ title: 'Aktualisiert' }), {
      params: Promise.resolve({ id: 'missing-id' }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('nicht gefunden');
  });

  it('gibt 400 bei Slug-Kollision aus Prisma zurück', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.update.mockRejectedValue({ code: 'P2002' });

    const response = await PATCH(createPatchRequest({ slug: 'duplikat' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });

    expect(response.status).toBe(400);
  });

  it('aktualisiert News erfolgreich', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.update.mockResolvedValue({
      id: 'test-id',
      title: 'Aktualisiert',
    });

    const response = await PATCH(createPatchRequest({ title: 'Aktualisiert' }), {
      params: Promise.resolve({ id: 'test-id' }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.news.update).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: { title: 'Aktualisiert' },
    });
  });
});

describe('DELETE /api/admin/news/:id', () => {
  it('gibt 404 zurück wenn News nicht gefunden wird', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.delete.mockRejectedValue({ code: 'P2025' });

    const response = await DELETE(createDeleteRequest(), {
      params: Promise.resolve({ id: 'missing-id' }),
    });

    expect(response.status).toBe(404);
  });
});
