/**
 * Tests für /api/daily/sudoku Route
 *
 * @jest-environment node
 */

const mockPrisma = {
  dailySudokuBoard: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  dailySudokuAttempt: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/games/sudoku/lib/sudokuGenerator', () => ({
  generateDailySudoku: jest.fn().mockReturnValue({
    puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)),
    solution: Array.from({ length: 9 }, () => Array(9).fill(1)),
    difficulty: 'medium',
    seed: 'test-sudoku-seed',
  }),
  getTodayDateString: jest.fn().mockReturnValue('2024-06-15'),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/daily/sudoku/route';

function createRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method || 'GET',
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/daily/sudoku', () => {
  it('gibt Puzzle-Daten zurück wenn Board existiert', async () => {
    mockPrisma.dailySudokuBoard.findUnique.mockResolvedValue({
      date: '2024-06-15',
      seed: 'test-seed',
      puzzle: JSON.stringify(Array.from({ length: 9 }, () => Array(9).fill(0))),
      solution: JSON.stringify(Array.from({ length: 9 }, () => Array(9).fill(1))),
      difficulty: 'medium',
    });

    const req = createRequest('http://localhost:3000/api/daily/sudoku?date=2024-06-15');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.date).toBe('2024-06-15');
    expect(data.puzzle).toHaveLength(9);
    expect(data.difficulty).toBe('medium');
  });

  it('generiert Board wenn keines existiert', async () => {
    mockPrisma.dailySudokuBoard.findUnique.mockResolvedValue(null);
    mockPrisma.dailySudokuBoard.create.mockResolvedValue({
      date: '2024-06-15',
      seed: 'test-seed',
      puzzle: JSON.stringify(Array.from({ length: 9 }, () => Array(9).fill(0))),
      difficulty: 'medium',
    });

    const req = createRequest('http://localhost:3000/api/daily/sudoku?date=2024-06-15');
    const response = await GET(req);

    expect(mockPrisma.dailySudokuBoard.create).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('inkludiert Spielerversuch wenn playerId gegeben', async () => {
    mockPrisma.dailySudokuBoard.findUnique.mockResolvedValue({
      date: '2024-06-15',
      puzzle: JSON.stringify(Array.from({ length: 9 }, () => Array(9).fill(0))),
      difficulty: 'medium',
    });
    mockPrisma.dailySudokuAttempt.findUnique.mockResolvedValue({
      completed: true,
      won: true,
      time: 300,
      moves: 81,
    });

    const req = createRequest('http://localhost:3000/api/daily/sudoku?date=2024-06-15&playerId=p1');
    const response = await GET(req);
    const data = await response.json();

    expect(data.attempt).not.toBeNull();
    expect(data.attempt.completed).toBe(true);
  });
});

describe('POST /api/daily/sudoku', () => {
  it('lehnt Anfragen ohne date und playerId ab', async () => {
    const req = createRequest('http://localhost:3000/api/daily/sudoku', {
      method: 'POST',
      body: { completed: true },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('gibt 404 wenn Board nicht existiert', async () => {
    mockPrisma.dailySudokuBoard.findUnique.mockResolvedValue(null);

    const req = createRequest('http://localhost:3000/api/daily/sudoku', {
      method: 'POST',
      body: { date: '2024-06-15', playerId: 'p1', completed: true, won: true, time: 300, moves: 81 },
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it('speichert Versuch korrekt', async () => {
    mockPrisma.dailySudokuBoard.findUnique.mockResolvedValue({ date: '2024-06-15' });
    mockPrisma.dailySudokuAttempt.upsert.mockResolvedValue({
      completed: true,
      won: true,
      time: 300,
      moves: 81,
    });

    const req = createRequest('http://localhost:3000/api/daily/sudoku', {
      method: 'POST',
      body: { date: '2024-06-15', playerId: 'p1', completed: true, won: true, time: 300, moves: 81 },
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.dailySudokuAttempt.upsert).toHaveBeenCalled();
  });
});
