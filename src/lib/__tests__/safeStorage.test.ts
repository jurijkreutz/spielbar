/* eslint-disable @typescript-eslint/no-require-imports */

describe('safeStorage', () => {
  function createStorage(overrides: Partial<Storage> = {}): Storage {
    const store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
      get length() {
        return Object.keys(store).length;
      },
      ...overrides,
    } as Storage;
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it('reads/writes/removes values when storage is available', () => {
    const local = createStorage();
    Object.defineProperty(window, 'localStorage', { value: local, configurable: true });

    const storage = require('../safeStorage');

    expect(storage.writeStorage('local', 'k', 'v')).toBe(true);
    expect(storage.readStorage('local', 'k')).toBe('v');
    expect(storage.removeStorage('local', 'k')).toBe(true);
    expect(storage.readStorage('local', 'k')).toBeNull();
    expect(storage.getStorageAvailability()).toEqual({ local: true, session: true });
  });

  it('handles SecurityError without throw and marks local storage unavailable', () => {
    const local = createStorage({
      getItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
    });

    Object.defineProperty(window, 'localStorage', { value: local, configurable: true });

    const storage = require('../safeStorage');

    expect(() => storage.readStorage('local', 'blocked-key')).not.toThrow();
    expect(storage.readStorage('local', 'blocked-key')).toBeNull();
    expect(storage.getStorageAvailability().local).toBe(false);
  });

  it('handles QuotaExceededError on session storage and notifies listeners', () => {
    const session = createStorage({
      setItem: jest.fn(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      }),
    });

    Object.defineProperty(window, 'sessionStorage', { value: session, configurable: true });

    const storage = require('../safeStorage');
    const listener = jest.fn();
    const unsubscribe = storage.subscribeStorageAvailability(listener);

    expect(storage.writeStorage('session', 'x', '1')).toBe(false);
    expect(storage.getStorageAvailability().session).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('uses memory fallback when persistence is blocked', () => {
    const local = createStorage({
      setItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
      getItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
      removeItem: jest.fn(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
    });

    Object.defineProperty(window, 'localStorage', { value: local, configurable: true });

    const storage = require('../safeStorage');

    expect(storage.writeStorage('local', 'id', 'abc', { memoryFallback: true })).toBe(true);
    expect(storage.readStorage('local', 'id', { memoryFallback: true })).toBe('abc');
    expect(storage.removeStorage('local', 'id', { memoryFallback: true })).toBe(true);
    expect(storage.readStorage('local', 'id', { memoryFallback: true })).toBeNull();
  });
});
