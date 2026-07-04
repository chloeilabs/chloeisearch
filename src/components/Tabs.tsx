import Link from 'next/link';
import { TABS } from '../lib/constants';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';

export default function Tabs({ query }: { query: SearchQuery }) {
  return (
    <nav aria-label="Search verticals" className="flex items-center text-[13px]">
      {TABS.map((t) => {
        const active = query.tab === t.value;
        return (
          <Link
            key={t.value}
            href={buildSearchUrl(query, { tab: t.value, page: 1 })}
            aria-current={active ? 'page' : undefined}
            className={`border-b-[3px] px-3 pb-2.5 pt-1 ${
              active
                ? 'border-accent font-medium text-accent'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
