'use client';

import { useEffect, useState } from 'react';
import { readStorage, useStorageAvailability, writeStorage } from '@/lib/safeStorage';

const NOTICE_SEEN_KEY = 'spielbar-storage-notice-seen';

export function StorageNotice() {
  const availability = useStorageAvailability();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (availability.local) return;

    const alreadySeen = readStorage('session', NOTICE_SEEN_KEY, { memoryFallback: true });
    if (alreadySeen) return;

    writeStorage('session', NOTICE_SEEN_KEY, 'true', { memoryFallback: true });
    setVisible(true);
  }, [availability.local]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
      role="status"
      aria-live="polite"
    >
      Speichern ist in diesem Browser derzeit nicht verfugbar. Das Spiel lauft normal weiter.
    </div>
  );
}
