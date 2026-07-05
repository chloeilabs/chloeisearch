'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  COUNTRIES,
  FRESHNESS_OPTIONS,
  SAFESEARCH_OPTIONS,
} from '../lib/constants';
import { buildSearchUrl } from '../lib/params';
import type { Freshness, SafeSearch, SearchQuery } from '../lib/types';

const selectClass =
  'rounded border border-line bg-page px-2 py-1 text-[13px] text-ink outline-none hover:bg-card';

export default function Filters({ query }: { query: SearchQuery }) {
  const router = useRouter();
  const hasActive = Boolean(
    query.freshness || query.safesearch !== 'moderate' || query.country,
  );
  const [open, setOpen] = useState(hasActive);

  function update(overrides: Partial<SearchQuery>) {
    router.push(buildSearchUrl(query, { ...overrides, page: 1 }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Transparent bottom border mirrors the tabs' 3px underline so the
          "Tools" label sits on the same baseline as the tab labels. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`border-b-[3px] border-transparent px-3 pb-2.5 pt-1 text-[13px] ${
          open || hasActive ? 'text-accent' : 'text-muted hover:text-ink'
        }`}
      >
        Tools
      </button>
      {open && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {query.tab !== 'images' && (
            <select
              aria-label="Filter by time"
              value={query.freshness ?? ''}
              onChange={(e) =>
                update({
                  freshness: (e.target.value || undefined) as
                    | Freshness
                    | undefined,
                })
              }
              className={selectClass}
            >
              {FRESHNESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="SafeSearch level"
            value={query.safesearch}
            onChange={(e) => update({ safesearch: e.target.value as SafeSearch })}
            className={selectClass}
          >
            {SAFESEARCH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Region"
            value={query.country ?? ''}
            onChange={(e) => update({ country: e.target.value || undefined })}
            className={selectClass}
          >
            {COUNTRIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
