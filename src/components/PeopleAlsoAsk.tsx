import { Segments } from './results/WebResults';
import type { FaqItem } from '../lib/types';

/**
 * Google's "People also ask" accordion, from the web response's faq block.
 * Pure HTML <details> — no client JS needed for expand/collapse.
 */
export default function PeopleAlsoAsk({ faq }: { faq: FaqItem[] }) {
  if (faq.length === 0) return null;

  return (
    <section className="mb-8 max-w-[600px]">
      <h2 className="mb-1 text-xl text-ink">People also ask</h2>
      <div className="divide-y divide-line border-y border-line">
        {faq.map((f) => (
          <details key={f.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
              {f.question}
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 fill-muted transition-transform group-open:rotate-180"
                aria-hidden
              >
                <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </summary>
            <div className="pb-4 text-sm leading-relaxed text-rurl">
              <Segments segments={f.answer} />
              {f.url && (
                <div className="mt-2">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rtitle hover:underline"
                  >
                    {f.source ?? f.url}
                  </a>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
