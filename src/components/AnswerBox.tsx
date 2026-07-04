import Link from 'next/link';
import { braveAnswer } from '../lib/brave';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';
import { Segments } from './results/WebResults';

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-accent" aria-hidden>
      <path d="M12 2l1.9 5.7L19.6 9l-5.7 1.9L12 16.6l-1.9-5.7L4.4 9l5.7-1.3L12 2zm7 12l.95 2.85L22.8 18l-2.85.95L19 21.8l-.95-2.85L15.2 18l2.85-1.15L19 14zM5 14l.95 2.85L8.8 18l-2.85.95L5 21.8l-.95-2.85L1.2 18l2.85-1.15L5 14z" />
    </svg>
  );
}

/** Streamed in via <Suspense> — grounded generation takes seconds. */
export default async function AnswerBox({ query }: { query: SearchQuery }) {
  const answer = await braveAnswer(query);
  if (!answer) return null;

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-accent">
        <SparkleIcon />
        AI Answer
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
        <Segments segments={answer.text} />
      </p>
      {answer.followups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {answer.followups.map((f) => (
            <Link
              key={f}
              href={buildSearchUrl(query, { q: f, page: 1 })}
              className="rounded-full border border-line bg-page px-3 py-1 text-[13px] text-accent hover:bg-chip"
            >
              {f}
            </Link>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">
        AI-generated from search results — verify important information.
      </p>
    </section>
  );
}

export function AnswerSkeleton() {
  return (
    <div className="mb-6 max-w-[652px] animate-pulse rounded-xl border border-line bg-card p-4">
      <div className="mb-3 h-4 w-24 rounded bg-chiphover" />
      <div className="mb-2 h-4 w-full rounded bg-chiphover" />
      <div className="mb-2 h-4 w-11/12 rounded bg-chiphover" />
      <div className="h-4 w-2/3 rounded bg-chiphover" />
    </div>
  );
}
