import { readStorage, writeStorage } from './safeStorage';

const SESSION_TOKEN_KEY = 'spielbar_hb_token';

function createToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionToken(): string {
  if (typeof window === 'undefined') return '';

  const stored = readStorage('session', SESSION_TOKEN_KEY, { memoryFallback: true });
  if (stored) return stored;

  const token = createToken();
  writeStorage('session', SESSION_TOKEN_KEY, token, { memoryFallback: true });
  return token;
}
