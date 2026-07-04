import SafeImage from '../SafeImage';
import { Segments } from './WebResults';
import type { NewsResult } from '../../lib/types';

export default function NewsList({ results }: { results: NewsResult[] }) {
  return (
    <div className="max-w-[652px]">
      {results.map((r) => (
        <article
          key={r.url}
          className="mb-4 rounded-xl border border-line p-4 transition-shadow hover:shadow-sm"
        >
          <a href={r.url} className="group flex gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                <SafeImage
                  src={r.favicon}
                  alt=""
                  className="h-4 w-4 rounded-full"
                  fallbackClassName="hidden"
                />
                <span className="truncate">{r.source}</span>
              </div>
              <h3 className="text-lg leading-6 text-rtitle group-hover:underline group-visited:text-rvisited">
                {r.title}
              </h3>
              <div className="mt-1 line-clamp-2 text-sm leading-relaxed text-rurl">
                <Segments segments={r.description} />
              </div>
              {r.age && <div className="mt-1.5 text-xs text-muted">{r.age}</div>}
            </div>
            {r.thumbnail && (
              <SafeImage
                src={r.thumbnail}
                alt=""
                className="h-[104px] w-[156px] shrink-0 rounded-lg bg-chip object-cover"
                fallbackClassName="hidden"
              />
            )}
          </a>
        </article>
      ))}
    </div>
  );
}
