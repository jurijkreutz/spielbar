import { readStorage, writeStorage } from './safeStorage';

const PLAYER_ID_KEY = 'spielbar-player-id';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';

  const stored = readStorage('local', PLAYER_ID_KEY, { memoryFallback: true });
  if (stored) return stored;

  const id = createId();
  writeStorage('local', PLAYER_ID_KEY, id, { memoryFallback: true });
  return id;
}
