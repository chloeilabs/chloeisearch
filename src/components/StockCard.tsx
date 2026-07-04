import { braveStock } from '../lib/brave';
import type { StockData } from '../lib/types';

const UP = '#137333';
const DOWN = '#a50e0e';
const UP_DARK = '#81c995';
const DOWN_DARK = '#f28b82';

function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatBig(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString('en-US');
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) return null;
  const W = 560;
  const H = 90;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = W / (points.length - 1);
  const coords = points.map(
    (p, i) => [i * step, H - 6 - ((p - min) / span) * (H - 12)] as const,
  );
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fill = `${path} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-[90px] w-full" aria-hidden>
      <path d={fill} fill={up ? UP : DOWN} opacity="0.08" />
      <path
        d={path}
        fill="none"
        stroke={up ? UP : DOWN}
        strokeWidth="1.75"
        className={up ? 'dark-stroke-up' : 'dark-stroke-down'}
      />
    </svg>
  );
}

/** Google Finance-style stock card, streamed in via <Suspense>. */
export default async function StockCard({ callbackKey }: { callbackKey: string }) {
  const s: StockData | null = await braveStock(callbackKey);
  if (!s) return null;

  const up = s.change >= 0;
  const sign = up ? '+' : '';
  const stats: [string, string][] = [];
  if (s.open !== undefined) stats.push(['Open', formatMoney(s.open)]);
  if (s.high !== undefined) stats.push(['High', formatMoney(s.high)]);
  if (s.low !== undefined) stats.push(['Low', formatMoney(s.low)]);
  if (s.marketCap !== undefined) stats.push(['Mkt cap', formatBig(s.marketCap)]);
  if (s.peRatio !== undefined) stats.push(['P/E ratio', s.peRatio.toFixed(2)]);
  if (s.week52High !== undefined) stats.push(['52-wk high', formatMoney(s.week52High)]);
  if (s.week52Low !== undefined) stats.push(['52-wk low', formatMoney(s.week52Low)]);

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-4">
      <div className="text-sm text-muted">
        {s.name} · {[s.exchange, s.symbol].filter(Boolean).join(': ')}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span className="text-4xl text-ink">{formatMoney(s.price)}</span>
        <span className="text-sm text-muted">{s.currency}</span>
        <span
          className="text-sm font-medium"
          style={{ color: up ? UP : DOWN }}
          data-dark-color={up ? UP_DARK : DOWN_DARK}
        >
          {sign}
          {formatMoney(s.change)} ({sign}
          {s.changePercent.toFixed(2)}%) today
        </span>
      </div>
      <Sparkline points={s.points} up={up} />
      {stats.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 border-t border-line pt-3 text-sm sm:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <dt className="text-muted">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-2 text-[11px] text-muted">
        {s.provider ? `Data by ${s.provider} · ` : ''}Delayed quote — not investment advice
      </div>
    </section>
  );
}

export function StockSkeleton() {
  return (
    <div className="mb-6 max-w-[652px] animate-pulse rounded-xl border border-line p-4">
      <div className="mb-3 h-4 w-48 rounded bg-chiphover" />
      <div className="mb-3 h-10 w-40 rounded bg-chiphover" />
      <div className="h-[90px] w-full rounded bg-chiphover" />
    </div>
  );
}
