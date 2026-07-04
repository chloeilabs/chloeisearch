import RateLimitNotice from './RateLimitNotice';

export type SearchErrorKind = 'config' | 'rate_limited' | 'upstream';

export default function ErrorState({
  kind,
  retryAfter,
}: {
  kind: SearchErrorKind;
  retryAfter?: number;
}) {
  if (kind === 'rate_limited') {
    return <RateLimitNotice retryAfter={retryAfter ?? 2} />;
  }
  return (
    <div className="max-w-[600px] py-6">
      <h2 className="text-xl text-ink">Something went wrong</h2>
      {kind === 'config' ? (
        <p className="mt-2 text-[15px] leading-6 text-muted">
          The Brave API key isn&apos;t configured. Paste your key into{' '}
          <code className="rounded bg-chip px-1 py-0.5 text-[13px]">
            .env.local
          </code>{' '}
          (<code className="rounded bg-chip px-1 py-0.5 text-[13px]">BRAVE_API_KEY=…</code>
          ) and restart the dev server — or set{' '}
          <code className="rounded bg-chip px-1 py-0.5 text-[13px]">
            BRAVE_MOCK=1
          </code>{' '}
          to browse with sample data.
        </p>
      ) : (
        <p className="mt-2 text-[15px] leading-6 text-muted">
          The search service returned an error. Try again in a moment.
        </p>
      )}
    </div>
  );
}
