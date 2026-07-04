'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RateLimitNotice({ retryAfter }: { retryAfter: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(
    Math.max(1, Math.round(retryAfter)),
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return (
    <div className="max-w-[600px] py-6">
      <h2 className="text-xl text-ink">Searching a little too fast</h2>
      <p className="mt-2 text-[15px] leading-6 text-muted">
        The search API&apos;s rate limit was hit.{' '}
        {remaining > 0 ? `You can retry in ${remaining}s…` : 'You can retry now.'}
      </p>
      <button
        type="button"
        disabled={remaining > 0}
        onClick={() => router.refresh()}
        className="mt-4 rounded border border-line px-4 py-2 text-sm text-accent hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
      >
        Try again
      </button>
    </div>
  );
}
