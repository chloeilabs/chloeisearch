import Link from 'next/link';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';

export default function DidYouMean({
  query,
  corrected,
}: {
  query: SearchQuery;
  corrected: string;
}) {
  return (
    <p className="mb-4 text-[15px]">
      <span className="text-ink">Did you mean: </span>
      <Link
        href={buildSearchUrl(query, { q: corrected, page: 1 })}
        className="font-bold italic text-rtitle hover:underline"
      >
        {corrected}
      </Link>
    </p>
  );
}
