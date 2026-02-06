'use client';

import { useEffect, useState } from 'react';

export default function LiveVisitorCount({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const data = await res.json();
          setCount(data.liveVisitors);
        }
      } catch {
        // Silently ignore
      }
    };

    const interval = setInterval(fetchCount, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <p className="text-sm text-zinc-500">Live Besucher</p>
      </div>
      <p className="text-4xl font-bold text-zinc-900 mt-2">{count}</p>
      <p className="text-xs text-zinc-400 mt-1">Aktualisiert alle 10s</p>
    </div>
  );
}
