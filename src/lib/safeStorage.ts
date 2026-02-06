import { useSyncExternalStore } from 'react';

export type StorageKind = 'local' | 'session';

type StorageAvailability = {
  local: boolean;
  session: boolean;
};

type StorageOptions = {
  memoryFallback?: boolean;
};

type StorageListener = () => void;

const availability: StorageAvailability = {
  local: true,
  session: true,
};
let availabilitySnapshot: StorageAvailability = { ...availability };

const memoryStores: Record<StorageKind, Map<string, string>> = {
  local: new Map<string, string>(),
  session: new Map<string, string>(),
};

const listeners = new Set<StorageListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function markUnavailable(kind: StorageKind) {
  if (!availability[kind]) return;
  availability[kind] = false;
  availabilitySnapshot = { ...availability };
  notifyListeners();
}

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    markUnavailable(kind);
    return null;
  }
}

function withStorage<T>(kind: StorageKind, run: (storage: Storage) => T): T | null {
  const storage = getStorage(kind);
  if (!storage) return null;

  try {
    return run(storage);
  } catch {
    markUnavailable(kind);
    return null;
  }
}

export function readStorage(
  kind: StorageKind,
  key: string,
  options: StorageOptions = {}
): string | null {
  const persisted = withStorage(kind, (storage) => storage.getItem(key));
  if (persisted !== null) return persisted;

  if (options.memoryFallback && typeof window !== 'undefined') {
    return memoryStores[kind].get(key) ?? null;
  }

  return null;
}

export function writeStorage(
  kind: StorageKind,
  key: string,
  value: string,
  options: StorageOptions = {}
): boolean {
  const persisted = withStorage(kind, (storage) => {
    storage.setItem(key, value);
    return true;
  });

  if (persisted === true) {
    if (options.memoryFallback) {
      memoryStores[kind].set(key, value);
    }
    return true;
  }

  if (options.memoryFallback && typeof window !== 'undefined') {
    memoryStores[kind].set(key, value);
    return true;
  }

  return false;
}

export function removeStorage(
  kind: StorageKind,
  key: string,
  options: StorageOptions = {}
): boolean {
  const removed = withStorage(kind, (storage) => {
    storage.removeItem(key);
    return true;
  });

  if (options.memoryFallback && typeof window !== 'undefined') {
    memoryStores[kind].delete(key);
  }

  return removed === true || Boolean(options.memoryFallback && typeof window !== 'undefined');
}

export function getStorageAvailability(): StorageAvailability {
  return { ...availabilitySnapshot };
}

function getStorageAvailabilitySnapshot(): StorageAvailability {
  return availabilitySnapshot;
}

export function subscribeStorageAvailability(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStorageAvailability(): StorageAvailability {
  return useSyncExternalStore(
    subscribeStorageAvailability,
    getStorageAvailabilitySnapshot,
    getStorageAvailabilitySnapshot
  );
}
