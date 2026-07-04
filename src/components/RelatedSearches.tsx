import Link from 'next/link';
import { braveSuggest } from '../lib/brave';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';

/**
 * Google's bottom-of-results "Related searches" chips, fed by the (cached)
 * suggest endpoint. Streams in via <Suspense>; renders nothing when suggest
 * is unavailable.
 */
export default async function RelatedSearches({ query }: { query: SearchQuery }) {
  const { suggestions } = await braveSuggest(query.q);
  const q = query.q.trim().toLowerCase();
  const related = suggestions.filter((s) => s.toLowerCase() !== q).slice(0, 8);
  if (related.length === 0) return null;

  return (
    <section className="mt-8 max-w-[652px]">
      <h2 className="mb-4 text-xl text-ink">Related searches</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {related.map((s) => (
          <Link
            key={s}
            href={buildSearchUrl(query, { q: s, page: 1 })}
            className="flex items-center gap-3 rounded-full bg-chip px-4 py-2.5 text-sm text-ink hover:bg-chiphover"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 fill-muted"
              aria-hidden
            >
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
            </svg>
            <span className="truncate">{s}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
