/**
 * Tests für /api/contact Route
 *
 * @jest-environment node
 */

const mockPrisma = {
  contactRequest: {
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/contact/route';

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/contact'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/contact', () => {
  it('akzeptiert valide Nachricht', async () => {
    mockPrisma.contactRequest.create.mockResolvedValue({ id: '1' });

    const req = createRequest({
      message: 'Das ist ein valides Feedback mit genug Zeichen.',
      sourcePath: '/games/sudoku',
      sourceContext: 'game:sudoku',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mockPrisma.contactRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourcePath: '/games/sudoku',
          sourceContext: 'game:sudoku',
        }),
      })
    );
  });

  it('lehnt zu kurze Nachricht ab', async () => {
    const req = createRequest({
      message: 'kurz',
      sourcePath: '/',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('lehnt ungültige E-Mail ab', async () => {
    const req = createRequest({
      message: 'Das ist ein valides Feedback mit genug Zeichen.',
      email: 'invalid-email',
      sourcePath: '/',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('ignoriert Honeypot und erstellt keinen Datensatz', async () => {
    const req = createRequest({
      message: 'Das ist ein valides Feedback mit genug Zeichen.',
      sourcePath: '/',
      honeypot: 'bot-filled',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mockPrisma.contactRequest.create).not.toHaveBeenCalled();
  });
});
