'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true });
  return () => window.removeEventListener('scroll', callback);
}

/** Google-style sticky header: hairline at rest, soft shadow once scrolled. */
export default function StickyHeader({ children }: { children: React.ReactNode }) {
  const scrolled = useSyncExternalStore(
    subscribe,
    () => window.scrollY > 4,
    () => false,
  );
  return (
    <header
      className={`sticky top-0 z-10 bg-page transition-shadow ${
        scrolled
          ? 'shadow-[0_1px_6px_rgba(32,33,36,0.28)]'
          : 'border-b border-line'
      }`}
    >
      {children}
    </header>
  );
}
