'use client';

import { useState } from 'react';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function TipCalculator() {
  const [bill, setBill] = useState('50');
  const [tipPct, setTipPct] = useState(18);
  const [people, setPeople] = useState(1);

  const billNum = Math.max(0, Number(bill) || 0);
  const tip = (billNum * tipPct) / 100;
  const total = billNum + tip;
  const per = total / Math.max(1, people);

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-5">
      <h2 className="mb-4 text-sm font-medium text-muted">Tip calculator</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Bill</span>
          <div className="flex items-center rounded-lg border border-line px-3">
            <span className="text-muted">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={bill}
              onChange={(e) => setBill(e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-ink outline-none"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-xs text-muted">
            <span>Tip</span>
            <span>{tipPct}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="40"
            value={tipPct}
            onChange={(e) => setTipPct(Number(e.target.value))}
            className="mt-3 w-full cursor-pointer accent-[var(--accent)]"
          />
          <div className="mt-2 flex gap-2">
            {[15, 18, 20, 25].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTipPct(p)}
                className={`rounded-full px-3 py-1 text-xs ${
                  tipPct === p ? 'bg-accent text-page' : 'bg-chip text-ink hover:bg-chiphover'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Split between</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Fewer people"
              onClick={() => setPeople((n) => Math.max(1, n - 1))}
              className="h-9 w-9 rounded-full bg-chip text-lg text-ink hover:bg-chiphover"
            >
              −
            </button>
            <span className="w-10 text-center text-ink">{people}</span>
            <button
              type="button"
              aria-label="More people"
              onClick={() => setPeople((n) => Math.min(50, n + 1))}
              className="h-9 w-9 rounded-full bg-chip text-lg text-ink hover:bg-chiphover"
            >
              +
            </button>
          </div>
        </label>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t border-line pt-4 sm:grid-cols-3">
        <Stat label="Tip" value={money(tip)} />
        <Stat label="Total" value={money(total)} />
        {people > 1 && <Stat label="Per person" value={money(per)} accent />}
      </dl>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`text-2xl ${accent ? 'text-accent' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}
