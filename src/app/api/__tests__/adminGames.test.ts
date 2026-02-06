/**
 * Tests für /api/admin/games Route
 *
 * @jest-environment node
 */

const mockPrisma = {
  game: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAuth = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/games/route';

function createRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/admin/games', () => {
  it('gibt 401 ohne Auth-Session zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('gibt Spiele-Liste zurück mit Auth', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.game.findMany.mockResolvedValue([
      { id: '1', name: 'Minesweeper', slug: 'minesweeper' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].slug).toBe('minesweeper');
  });
});

describe('POST /api/admin/games', () => {
  it('gibt 401 ohne Auth-Session zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const req = createRequest('http://localhost:3000/api/admin/games', {
      method: 'POST',
      body: { name: 'Test' },
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('validiert erforderliche Felder', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    const req = createRequest('http://localhost:3000/api/admin/games', {
      method: 'POST',
      body: { name: 'Test' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('validiert shortDescription Länge', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    const req = createRequest('http://localhost:3000/api/admin/games', {
      method: 'POST',
      body: {
        name: 'Test',
        slug: 'test',
        shortDescription: 'x'.repeat(121),
        gameComponent: 'TestGame',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('prüft Slug-Einzigartigkeit', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.game.findUnique.mockResolvedValue({ id: '1', slug: 'existing' });

    const req = createRequest('http://localhost:3000/api/admin/games', {
      method: 'POST',
      body: {
        name: 'Test',
        slug: 'existing',
        shortDescription: 'Kurze Beschreibung',
        gameComponent: 'TestGame',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Slug');
  });

  it('erstellt Spiel erfolgreich', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.game.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        game: {
          updateMany: jest.fn(),
          create: jest.fn().mockResolvedValue({
            id: 'new-id',
            name: 'Neues Spiel',
            slug: 'neues-spiel',
          }),
        },
      });
    });

    const req = createRequest('http://localhost:3000/api/admin/games', {
      method: 'POST',
      body: {
        name: 'Neues Spiel',
        slug: 'neues-spiel',
        shortDescription: 'Ein neues Spiel',
        gameComponent: 'NeuesSpiel',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });
});
