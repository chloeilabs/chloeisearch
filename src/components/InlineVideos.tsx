import Link from 'next/link';
import SafeImage from './SafeImage';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery, VideoResult } from '../lib/types';

/** Google's inline "Videos" row, mixed into web results. */
export default function InlineVideos({
  videos,
  query,
}: {
  videos: VideoResult[];
  query: SearchQuery;
}) {
  if (videos.length === 0) return null;

  return (
    <section className="mb-8 max-w-[600px]">
      <h2 className="mb-3 text-xl text-ink">Videos</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {videos.map((v) => (
          <a
            key={v.url}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-[180px] shrink-0"
          >
            <div className="relative">
              <SafeImage
                src={v.thumbnail}
                alt=""
                className="h-[100px] w-[180px] rounded-lg bg-chip object-cover"
                fallbackClassName="block h-[100px] w-[180px] rounded-lg bg-chip"
              />
              {v.duration && (
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[11px] text-white">
                  {v.duration}
                </span>
              )}
            </div>
            <div className="mt-1.5 line-clamp-2 text-[13px] leading-4 text-ink group-hover:underline">
              {v.title}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted">
              {[v.source, v.age].filter(Boolean).join(' · ')}
            </div>
          </a>
        ))}
      </div>
      <Link
        href={buildSearchUrl(query, { tab: 'videos', page: 1 })}
        className="text-sm text-accent hover:underline"
      >
        View all
      </Link>
    </section>
  );
}
