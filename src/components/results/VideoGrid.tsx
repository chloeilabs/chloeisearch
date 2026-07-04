import SafeImage from '../SafeImage';
import type { VideoResult } from '../../lib/types';

export default function VideoGrid({ results }: { results: VideoResult[] }) {
  return (
    <div className="max-w-[652px]">
      {results.map((r) => (
        <article key={r.url} className="mb-6">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 sm:flex-row sm:gap-4"
          >
            <div className="relative w-fit shrink-0">
              <SafeImage
                src={r.thumbnail}
                alt=""
                className="h-[118px] w-[210px] rounded-lg bg-chip object-cover"
                fallbackClassName="block h-[118px] w-[210px] rounded-lg bg-chip"
              />
              {r.duration && (
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 text-[11px] text-white">
                  {r.duration}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg leading-6 text-rtitle group-hover:underline group-visited:text-rvisited">
                {r.title}
              </h3>
              {r.description && (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-rurl">
                  {r.description}
                </p>
              )}
              <div className="mt-1.5 text-xs text-muted">
                {[r.source, r.age].filter(Boolean).join(' · ')}
              </div>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}
