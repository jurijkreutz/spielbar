/* eslint-disable @typescript-eslint/no-require-imports */

describe('dailyProgressStorage', () => {
  function createStorage(): Storage {
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
    } as Storage;
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it('stores and restores payloads per game/date/player key', () => {
    const local = createStorage();
    Object.defineProperty(window, 'localStorage', { value: local, configurable: true });

    const storage = require('../dailyProgressStorage');
    const payload = { version: 1, time: 42, moves: 17 };

    expect(storage.writeDailyProgress('minesweeper', '2026-02-07', 'player-1', payload)).toBe(true);
    expect(
      storage.readDailyProgress('minesweeper', '2026-02-07', 'player-1')
    ).toEqual(payload);
    expect(storage.readDailyProgress('minesweeper', '2026-02-07', 'player-2')).toBeNull();
    expect(storage.readDailyProgress('sudoku', '2026-02-07', 'player-1')).toBeNull();

    expect(local.setItem).toHaveBeenCalledWith(
      'spielbar-daily-progress-v1:minesweeper:2026-02-07:player-1',
      JSON.stringify(payload)
    );
  });

  it('clears only the requested progress key', () => {
    const local = createStorage();
    Object.defineProperty(window, 'localStorage', { value: local, configurable: true });

    const storage = require('../dailyProgressStorage');

    storage.writeDailyProgress('sudoku', '2026-02-07', 'player-1', { version: 1, time: 1 });
    storage.writeDailyProgress('sudoku', '2026-02-07', 'player-2', { version: 1, time: 2 });

    expect(storage.clearDailyProgress('sudoku', '2026-02-07', 'player-1')).toBe(true);
    expect(storage.readDailyProgress('sudoku', '2026-02-07', 'player-1')).toBeNull();
    expect(storage.readDailyProgress('sudoku', '2026-02-07', 'player-2')).toEqual({
      version: 1,
      time: 2,
    });
  });
});
