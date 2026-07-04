'use client';

import { useState } from 'react';
import SafeImage from '../SafeImage';
import type { ImageResult } from '../../lib/types';

/**
 * Google Images behavior: on md+ screens clicking a tile opens a preview
 * panel on the right (larger image + Visit button); on small screens tiles
 * link straight to the source page.
 */
export default function ImageGrid({ results }: { results: ImageResult[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const sel = selected !== null ? results[selected] : undefined;

  return (
    <div className="flex items-start gap-6 pb-16">
      {/* CSS-columns masonry, like Google Images' variable-height tiles. */}
      <div
        className={`min-w-0 flex-1 gap-3 ${
          sel ? 'columns-2 lg:columns-3' : 'columns-2 sm:columns-3 md:columns-4 xl:columns-5'
        }`}
      >
        {results.map((r, i) => (
          <a
            key={`${r.url}|${r.thumbnail}`}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (window.innerWidth >= 768) {
                e.preventDefault();
                setSelected(i === selected ? null : i);
              }
            }}
            className={`group mb-3 block break-inside-avoid rounded-xl ${
              i === selected ? 'ring-2 ring-accent ring-offset-2' : ''
            }`}
          >
            <SafeImage
              src={r.thumbnail}
              alt={r.title}
              className="h-auto w-full rounded-xl bg-chip transition group-hover:brightness-90"
              fallbackClassName="block h-40 w-full rounded-xl bg-chip"
            />
            <div className="mt-1.5 truncate text-xs text-muted">{r.source}</div>
            <div className="truncate text-[13px] text-ink group-hover:underline">
              {r.title}
            </div>
          </a>
        ))}
      </div>

      {sel && (
        <aside className="sticky top-32 hidden w-[380px] shrink-0 rounded-2xl border border-line p-4 md:block">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-muted">{sel.source}</span>
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setSelected(null)}
              className="shrink-0 rounded-full p-1 text-muted hover:bg-chip"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sel.fullSrc ?? sel.thumbnail}
            alt={sel.title}
            referrerPolicy="no-referrer"
            className="mt-3 max-h-[420px] w-full rounded-lg bg-chip object-contain"
            onError={(e) => {
              // full-size blocked by the host? fall back to the CDN thumbnail
              if (e.currentTarget.src !== sel.thumbnail) {
                e.currentTarget.src = sel.thumbnail;
              }
            }}
          />
          <div className="mt-3 line-clamp-2 text-[15px] leading-5 text-ink">
            {sel.title}
          </div>
          <a
            href={sel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm text-page hover:opacity-90"
          >
            Visit
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
            </svg>
          </a>
        </aside>
      )}
    </div>
  );
}
