import Link from 'next/link';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';

export default function EmptyState({ query }: { query: SearchQuery }) {
  return (
    <div className="max-w-[600px] py-6 text-[15px] leading-7 text-ink">
      <p>
        Your search — <b>{query.q}</b>
        {query.page > 1 ? ` (page ${query.page})` : ''} — did not match any
        documents.
      </p>
      <p className="mt-4">Suggestions:</p>
      <ul className="mt-1 list-disc pl-8 text-muted">
        <li>Make sure all words are spelled correctly.</li>
        <li>Try different keywords.</li>
        <li>Try more general keywords.</li>
        {query.freshness && <li>Try removing the time filter.</li>}
      </ul>
      {query.page > 1 && (
        <p className="mt-4">
          <Link
            href={buildSearchUrl(query, { page: 1 })}
            className="text-rtitle hover:underline"
          >
            ← Back to page 1
          </Link>
        </p>
      )}
    </div>
  );
}
