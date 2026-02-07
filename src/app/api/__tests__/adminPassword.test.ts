/**
 * Tests für /api/admin/password Route
 *
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockCompare = jest.fn();
const mockHash = jest.fn();
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('bcryptjs', () => ({
  compare: (...args: unknown[]) => mockCompare(...args),
  hash: (...args: unknown[]) => mockHash(...args),
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/password/route';

function createPatchRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/admin/password'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PATCH /api/admin/password', () => {
  it('gibt 401 ohne Auth zurück', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(
      createPatchRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      })
    );

    expect(response.status).toBe(401);
  });

  it('validiert Pflichtfelder', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-id' } });

    const response = await PATCH(
      createPatchRequest({
        currentPassword: '',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      })
    );

    expect(response.status).toBe(400);
  });

  it('validiert Passwort-Bestätigung', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-id' } });

    const response = await PATCH(
      createPatchRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'otherPassword123',
      })
    );

    expect(response.status).toBe(400);
  });

  it('validiert Mindestlänge vom neuen Passwort', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-id' } });

    const response = await PATCH(
      createPatchRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'kurz',
        confirmPassword: 'kurz',
      })
    );

    expect(response.status).toBe(400);
  });

  it('lehnt falsches aktuelles Passwort ab', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-id' } });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      password: 'stored-hash',
    });
    mockCompare.mockResolvedValue(false);

    const response = await PATCH(
      createPatchRequest({
        currentPassword: 'wrongPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      })
    );

    expect(response.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('ändert das Passwort erfolgreich', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-id' } });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      password: 'stored-hash',
    });
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue('new-hash');
    mockPrisma.user.update.mockResolvedValue({ id: 'admin-id' });

    const response = await PATCH(
      createPatchRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      })
    );

    expect(response.status).toBe(200);
    expect(mockHash).toHaveBeenCalledWith('newPassword123', 12);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'admin-id' },
      data: { password: 'new-hash' },
    });
  });

  it('nutzt E-Mail als Fallback wenn keine user.id in der Session vorhanden ist', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'admin@spielbar.at' } });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      password: 'stored-hash',
    });
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue('new-hash');
    mockPrisma.user.update.mockResolvedValue({ id: 'admin-id' });

    const response = await PATCH(
      createPatchRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      })
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@spielbar.at' },
      select: { id: true, password: true },
    });
  });
});
