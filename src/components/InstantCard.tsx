import type { InstantAnswer } from '../lib/instant';

/**
 * Google-style instant answer card. The calculator is right-aligned (like
 * Google's calculator widget); conversions and times are left-aligned.
 */
export default function InstantCard({ answer }: { answer: InstantAnswer }) {
  const align = answer.kind === 'calculator' ? 'text-right' : 'text-left';
  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-5">
      <div className={`${align} text-sm text-muted`}>{answer.expression}</div>
      <div className={`mt-1 break-words ${align} text-4xl text-ink`}>
        {answer.result}
      </div>
    </section>
  );
}
