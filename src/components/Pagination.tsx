import Link from 'next/link';
import { MAX_PAGE } from '../lib/constants';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';

const BLUE = '#4285f4';
const RED = '#ea4335';
const YELLOW = '#fbbc05';
const GREEN = '#34a853';

/** A letter with an optional page number beneath (classic Google pager column). */
function Column({
  letters,
  number,
  href,
  current,
}: {
  letters: { char: string; color: string }[];
  number?: number;
  href?: string;
  current?: boolean;
}) {
  const body = (
    <span className="flex flex-col items-center leading-none">
      <span className="text-[27px] font-medium">
        {letters.map((l, i) => (
          <span key={i} style={{ color: l.color }}>
            {l.char}
          </span>
        ))}
      </span>
      <span
        className={`mt-1 text-sm ${
          number === undefined
            ? 'invisible'
            : current
              ? 'font-bold text-ink'
              : 'text-rtitle group-hover:underline'
        }`}
      >
        {number ?? 0}
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="group px-[3px]" aria-label={`Page ${number}`}>
      {body}
    </Link>
  ) : (
    <span className="px-[3px]" aria-current={current ? 'page' : undefined}>
      {body}
    </span>
  );
}

/**
 * The classic "Goooooogle" pager, in our wordmark: an S, one "e" per page
 * (current page's letter in red), then "arch". Brave has no total count, so
 * when more results exist we offer the full reachable range (offset caps at
 * 10 pages), Google-style.
 */
export default function Pagination({
  query,
  hasMore,
}: {
  query: SearchQuery;
  hasMore: boolean;
}) {
  const current = query.page;
  const maxPage = hasMore ? MAX_PAGE : current;
  if (maxPage <= 1) return null;

  const pages = Array.from({ length: maxPage }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-start pb-10 text-sm"
    >
      <div className="flex items-start">
        <span className="flex w-16 justify-end pr-2 pt-6">
          {current > 1 && (
            <Link
              href={buildSearchUrl(query, { page: current - 1 })}
              className="text-rtitle hover:underline"
            >
              ‹ Previous
            </Link>
          )}
        </span>
        <Column letters={[{ char: 'S', color: BLUE }]} />
        {pages.map((p) => (
          <Column
            key={p}
            letters={[{ char: 'e', color: p === current ? RED : YELLOW }]}
            number={p}
            current={p === current}
            href={p === current ? undefined : buildSearchUrl(query, { page: p })}
          />
        ))}
        <Column
          letters={[
            { char: 'a', color: YELLOW },
            { char: 'r', color: BLUE },
            { char: 'c', color: GREEN },
            { char: 'h', color: RED },
          ]}
        />
        <span className="flex w-16 pl-2 pt-6">
          {hasMore && current < MAX_PAGE && (
            <Link
              href={buildSearchUrl(query, { page: current + 1 })}
              className="text-rtitle hover:underline"
            >
              Next ›
            </Link>
          )}
        </span>
      </div>
    </nav>
  );
}
