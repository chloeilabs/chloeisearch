'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[search/error]', error);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl text-ink">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        An unexpected error occurred while loading results.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded border border-line px-4 py-2 text-sm text-accent hover:bg-card"
      >
        Try again
      </button>
    </main>
  );
}
