/* eslint-disable @typescript-eslint/no-require-imports */

describe('runtime identity fallback', () => {
  function blockedStorage(): Storage {
    return {
      getItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
      setItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
      removeItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
      clear: jest.fn(),
      key: jest.fn(() => null),
      length: 0,
    } as unknown as Storage;
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it('keeps playerId stable with memory fallback when localStorage is blocked', () => {
    Object.defineProperty(window, 'localStorage', {
      value: blockedStorage(),
      configurable: true,
    });

    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...originalCrypto, randomUUID: jest.fn(() => 'player-uuid') },
      configurable: true,
    });
    const { getPlayerId } = require('../playerId');

    expect(getPlayerId()).toBe('player-uuid');
    expect(getPlayerId()).toBe('player-uuid');
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('keeps sessionToken stable with memory fallback when sessionStorage is blocked', () => {
    Object.defineProperty(window, 'sessionStorage', {
      value: blockedStorage(),
      configurable: true,
    });

    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...originalCrypto, randomUUID: jest.fn(() => 'session-uuid') },
      configurable: true,
    });
    const { getSessionToken } = require('../sessionToken');

    expect(getSessionToken()).toBe('session-uuid');
    expect(getSessionToken()).toBe('session-uuid');
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });
});
