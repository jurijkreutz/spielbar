'use client';

import { useEffect, useState } from 'react';

export function RandomBadge() {
  const [content, setContent] = useState<{ text: string } | null>(null);

  useEffect(() => {
    const badges = ['since 2026', 'made in austria', 'no more office-boredom', 'play now', 'free to play', 'just for fun'];
    const randomText = badges[Math.floor(Math.random() * badges.length)];

    // Nach 1 Sekunde: rendere das Badge mit zufälligem Text
    const timer = setTimeout(() => {
      setContent({ text: randomText });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Vor 1 Sekunde: rendere nichts
  if (!content) {
    return null;
  }

  return (
    <div className="retro-badge px-2 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wide whitespace-nowrap">
      {content.text}
    </div>
  );
}

