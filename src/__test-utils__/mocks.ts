/**
 * Gemeinsame Test-Mocks für API-Tests
 */

// Prisma Mock Factory
export function createPrismaMock() {
  return {
    dailyBoard: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    dailyAttempt: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    dailySudokuBoard: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    dailySudokuAttempt: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    game: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    news: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

// Auth Session Mock
export function createAuthSessionMock(authenticated = true) {
  if (!authenticated) return null;
  return {
    user: {
      id: 'test-user-id',
      email: 'admin@spielbar.de',
      name: 'Test Admin',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

// NextRequest Mock Factory
export function createNextRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    searchParams?: Record<string, string>;
  } = {}
) {
  const fullUrl = new URL(url, 'http://localhost:3000');
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      fullUrl.searchParams.set(key, value);
    }
  }

  return {
    nextUrl: fullUrl,
    method: options.method || 'GET',
    json: jest.fn().mockResolvedValue(options.body || {}),
    formData: jest.fn(),
  };
}
