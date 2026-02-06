/**
 * Tests für /api/admin/news Route
 *
 * @jest-environment node
 */

const mockPrisma = {
  news: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockAuth = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/news/route';

function createRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/admin/news', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('gibt News-Liste zurück mit Auth', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.findMany.mockResolvedValue([
      { id: '1', title: 'Neuigkeiten', slug: 'neuigkeiten' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});

describe('POST /api/admin/news', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);
    const req = createRequest('http://localhost:3000/api/admin/news', {
      method: 'POST',
      body: { title: 'Test' },
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('validiert erforderliche Felder', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    const req = createRequest('http://localhost:3000/api/admin/news', {
      method: 'POST',
      body: { title: 'Test' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('prüft Slug-Einzigartigkeit', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.findUnique.mockResolvedValue({ id: '1', slug: 'existing' });

    const req = createRequest('http://localhost:3000/api/admin/news', {
      method: 'POST',
      body: { title: 'Test', slug: 'existing', content: 'Inhalt' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('erstellt News mit publishedAt bei Status published', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.findUnique.mockResolvedValue(null);
    mockPrisma.news.create.mockResolvedValue({
      id: 'new-id',
      title: 'Neue News',
      slug: 'neue-news',
      publishedAt: new Date(),
    });

    const req = createRequest('http://localhost:3000/api/admin/news', {
      method: 'POST',
      body: {
        title: 'Neue News',
        slug: 'neue-news',
        content: 'Inhalt der News',
        status: 'published',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);

    const createCall = mockPrisma.news.create.mock.calls[0][0];
    expect(createCall.data.publishedAt).toBeInstanceOf(Date);
  });

  it('setzt publishedAt nicht bei Status draft', async () => {
    mockAuth.mockResolvedValue({ user: { id: '1' } });
    mockPrisma.news.findUnique.mockResolvedValue(null);
    mockPrisma.news.create.mockResolvedValue({
      id: 'new-id',
      title: 'Draft News',
      slug: 'draft-news',
    });

    const req = createRequest('http://localhost:3000/api/admin/news', {
      method: 'POST',
      body: {
        title: 'Draft News',
        slug: 'draft-news',
        content: 'Entwurf',
        status: 'draft',
      },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);

    const createCall = mockPrisma.news.create.mock.calls[0][0];
    expect(createCall.data.publishedAt).toBeNull();
  });
});
