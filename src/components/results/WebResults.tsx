import SafeImage from '../SafeImage';
import type { TextSegment, WebResult } from '../../lib/types';

/** Renders parsed description segments as text nodes — never raw HTML. */
export function Segments({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.bold ? (
          <strong key={i} className="font-bold">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Web results with optional interleaved blocks, Google-style: "People also
 * ask" after the third result, the inline Videos row after the sixth.
 */
export default function WebResults({
  results,
  afterThird,
  afterSixth,
}: {
  results: WebResult[];
  afterThird?: React.ReactNode;
  afterSixth?: React.ReactNode;
}) {
  const items = results.map((r) => (
        <article key={r.url} className="mb-8">
          {/* Google makes the favicon row + title one clickable block. */}
          <a href={r.url} className="group block">
            <div className="mb-1 flex items-center gap-3">
              <SafeImage
                src={r.favicon}
                alt=""
                className="h-[26px] w-[26px] rounded-full border border-line bg-page object-contain p-[2px]"
                fallbackClassName="inline-block h-[26px] w-[26px] rounded-full bg-chip"
              />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm text-ink">
                  {r.siteName ?? r.displayUrl.split(' › ')[0]}
                </div>
                <div className="truncate text-xs text-rurl">{r.displayUrl}</div>
              </div>
            </div>
            <h3 className="mt-1 text-xl leading-[26px]">
              <span className="text-rtitle group-visited:text-rvisited group-hover:underline">
                {r.title}
              </span>
            </h3>
          </a>
          <div className="mt-1 text-sm leading-[1.58] text-rurl">
            {r.age && <span className="text-muted">{r.age} — </span>}
            <Segments segments={r.description} />
          </div>
          {r.extraSnippets && r.extraSnippets.length > 0 && (
            <ul className="mt-1.5 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
              {r.extraSnippets.slice(0, 2).map((s, i) => (
                <li key={i} className="mt-0.5">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </article>
  ));

  return (
    <div className="max-w-[600px]">
      {items.slice(0, 3)}
      {afterThird}
      {items.slice(3, 6)}
      {afterSixth}
      {items.slice(6)}
    </div>
  );
}
