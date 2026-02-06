'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function generateToken(): string {
  return crypto.randomUUID();
}

function getSessionToken(): string {
  const key = 'spielbar_hb_token';
  let token = sessionStorage.getItem(key);
  if (!token) {
    token = generateToken();
    sessionStorage.setItem(key, token);
  }
  return token;
}

export default function Heartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname?.startsWith('/admin')) return;

    const token = getSessionToken();

    const sendHeartbeat = () => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, page: pathname }),
      }).catch(() => {
        // Silently ignore errors
      });
    };

    // Send immediately on mount / route change
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 30_000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
