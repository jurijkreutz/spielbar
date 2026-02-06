/**
 * Tests für /api/daily Route (Minesweeper Daily)
 *
 * @jest-environment node
 */

const mockPrisma = {
  dailyBoard: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  dailyAttempt: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/games/minesweeper/lib/dailyBoard', () => ({
  generateDailyBoard: jest.fn().mockReturnValue({
    rows: 9,
    cols: 9,
    mines: 10,
    minePositions: [[0, 1], [2, 3]],
    startPosition: [4, 4],
    difficulty: 'easy',
    seed: 'test-seed',
  }),
  getTodayDateString: jest.fn().mockReturnValue('2024-06-15'),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/daily/route';

function createRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/daily', () => {
  it('gibt Board-Daten zurück wenn Board existiert', async () => {
    mockPrisma.dailyBoard.findUnique.mockResolvedValue({
      date: '2024-06-15',
      seed: 'test-seed',
      rows: 9,
      cols: 9,
      mines: 10,
      minePositions: '[[0,1],[2,3]]',
      difficulty: 'easy',
      verified: true,
    });

    const req = createRequest('http://localhost:3000/api/daily?date=2024-06-15');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.date).toBe('2024-06-15');
    expect(data.rows).toBe(9);
    expect(data.cols).toBe(9);
    expect(data.mines).toBe(10);
    expect(data.minePositions).toEqual([[0, 1], [2, 3]]);
    expect(data.difficulty).toBe('easy');
  });

  it('generiert Board wenn keines existiert', async () => {
    mockPrisma.dailyBoard.findUnique.mockResolvedValue(null);
    mockPrisma.dailyBoard.create.mockResolvedValue({
      date: '2024-06-15',
      seed: 'test-seed',
      rows: 9,
      cols: 9,
      mines: 10,
      minePositions: '[[0,1],[2,3]]',
      difficulty: 'easy',
      verified: true,
    });

    const req = createRequest('http://localhost:3000/api/daily?date=2024-06-15');
    const response = await GET(req);
    const data = await response.json();

    expect(mockPrisma.dailyBoard.create).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(data.rows).toBe(9);
  });

  it('inkludiert Spielerversuch wenn playerId gegeben', async () => {
    mockPrisma.dailyBoard.findUnique.mockResolvedValue({
      date: '2024-06-15',
      seed: 'test-seed',
      rows: 9,
      cols: 9,
      mines: 10,
      minePositions: '[[0,1],[2,3]]',
      difficulty: 'easy',
      verified: true,
    });
    mockPrisma.dailyAttempt.findUnique.mockResolvedValue({
      completed: true,
      won: true,
      time: 120,
      moves: 45,
      usedHints: false,
    });

    const req = createRequest('http://localhost:3000/api/daily?date=2024-06-15&playerId=player123');
    const response = await GET(req);
    const data = await response.json();

    expect(data.attempt).not.toBeNull();
    expect(data.attempt.completed).toBe(true);
    expect(data.attempt.won).toBe(true);
    expect(data.attempt.time).toBe(120);
  });

  it('gibt attempt null zurück wenn keine playerId', async () => {
    mockPrisma.dailyBoard.findUnique.mockResolvedValue({
      date: '2024-06-15',
      seed: 'test-seed',
      rows: 9,
      cols: 9,
      mines: 10,
      minePositions: '[[0,1],[2,3]]',
      difficulty: 'easy',
      verified: true,
    });

    const req = createRequest('http://localhost:3000/api/daily?date=2024-06-15');
    const response = await GET(req);
    const data = await response.json();

    expect(data.attempt).toBeNull();
  });
});

describe('POST /api/daily', () => {
  it('lehnt Anfragen ohne date und playerId ab', async () => {
    const req = createRequest('http://localhost:3000/api/daily', {
      method: 'POST',
      body: { completed: true },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('gibt 404 zurück wenn Board nicht existiert', async () => {
    mockPrisma.dailyBoard.findUnique.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/daily', {
      method: 'POST',
      body: { date: '2024-06-15', playerId: 'p1', completed: true, won: true, time: 60, moves: 30 },
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it('speichert Versuch korrekt (upsert)', async () => {
    mockPrisma.dailyBoard.findUnique.mockResolvedValue({ date: '2024-06-15' });
    mockPrisma.dailyAttempt.upsert.mockResolvedValue({
      completed: true,
      won: true,
      time: 90,
      moves: 40,
      usedHints: false,
    });

    const req = createRequest('http://localhost:3000/api/daily', {
      method: 'POST',
      body: {
        date: '2024-06-15',
        playerId: 'player1',
        completed: true,
        won: true,
        time: 90,
        moves: 40,
      },
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.attempt.completed).toBe(true);
    expect(mockPrisma.dailyAttempt.upsert).toHaveBeenCalled();
  });
});
