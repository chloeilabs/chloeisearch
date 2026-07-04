import Link from 'next/link';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';

/**
 * Brave auto-corrected the query — Google's two-line banner:
 * "Showing results for <corrected> / Search instead for <original>",
 * where the second link forces a verbatim search (spellcheck=0).
 */
export default function AlteredQueryNotice({
  query,
  altered,
}: {
  query: SearchQuery;
  altered: string;
}) {
  return (
    <div className="mb-4 text-[15px] leading-6">
      <p className="text-ink">
        Showing results for{' '}
        <Link
          href={buildSearchUrl(query, { q: altered, page: 1 })}
          className="font-bold italic text-rtitle hover:underline"
        >
          {altered}
        </Link>
      </p>
      <p className="text-sm text-muted">
        Search instead for{' '}
        <Link
          href={buildSearchUrl(query, { nospell: true, page: 1 })}
          className="italic text-rtitle hover:underline"
        >
          {query.q}
        </Link>
      </p>
    </div>
  );
}
