'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from '../../lib/calc';

function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString('en-US');
  const rounded = Number(n.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

interface Key {
  label: string;
  /** what to append; special handlers are keyed off `label` */
  push?: string;
  cls?: string;
  invLabel?: string;
  invPush?: string;
  aria?: string;
}

const SCI: Key[] = [
  { label: 'Rad', cls: 'mode' },
  { label: 'x!', push: '!' },
  { label: 'Inv', cls: 'op' },
  { label: 'sin', push: 'sin(', invLabel: 'sin⁻¹', invPush: 'asin(' },
  { label: 'ln', push: 'ln(' },
  { label: 'π', push: 'π' },
  { label: 'cos', push: 'cos(', invLabel: 'cos⁻¹', invPush: 'acos(' },
  { label: 'log', push: 'log(' },
  { label: 'e', push: 'e' },
  { label: 'tan', push: 'tan(', invLabel: 'tan⁻¹', invPush: 'atan(' },
  { label: '√', push: 'sqrt(' },
  { label: 'Ans', cls: 'op' },
  { label: 'EXP', push: 'e' },
  { label: 'xʸ', push: '^' },
];

const PAD: Key[] = [
  { label: '(', push: '(' },
  { label: ')', push: ')' },
  { label: '%', push: '%' },
  { label: 'AC', cls: 'clear' },
  { label: '7', push: '7' }, { label: '8', push: '8' }, { label: '9', push: '9' },
  { label: '÷', push: '÷', cls: 'op' },
  { label: '4', push: '4' }, { label: '5', push: '5' }, { label: '6', push: '6' },
  { label: '×', push: '×', cls: 'op' },
  { label: '1', push: '1' }, { label: '2', push: '2' }, { label: '3', push: '3' },
  { label: '−', push: '−', cls: 'op' },
  { label: '0', push: '0' }, { label: '.', push: '.' },
  { label: '⌫', cls: 'op', aria: 'Backspace' },
  { label: '+', push: '+', cls: 'op' },
  { label: '=', cls: 'equals' },
];

export default function Calculator({ seed }: { seed: string }) {
  const [expr, setExpr] = useState(seed);
  const [deg, setDeg] = useState(false);
  const [inv, setInv] = useState(false);
  // A query-seeded expression ("2+2") arrives already answered, like Google:
  // typing a digit starts a fresh calculation; an operator continues it.
  const [justEvaluated, setJustEvaluated] = useState(Boolean(seed));
  const ansRef = useRef<number | null>(null);

  const preview = useMemo(() => {
    if (!expr) return '';
    const v = evaluate(expr, { deg });
    return v === null ? '' : formatResult(v);
  }, [expr, deg]);

  const append = useCallback(
    (text: string) => {
      setExpr((prev) => {
        if (justEvaluated) {
          // Right after an answer: a digit starts fresh, an operator
          // continues from the evaluated result (like Google), not from
          // the raw expression text.
          if (/[0-9.]/.test(text)) return text;
          const v = evaluate(prev, { deg });
          if (v !== null) return formatResult(v).replace(/,/g, '') + text;
        }
        return prev + text;
      });
      setJustEvaluated(false);
    },
    [justEvaluated, deg],
  );

  const doEquals = useCallback(() => {
    const v = evaluate(expr, { deg });
    if (v === null) return;
    ansRef.current = v;
    setExpr(formatResult(v).replace(/,/g, ''));
    setJustEvaluated(true);
  }, [expr, deg]);

  const onKey = useCallback(
    (key: Key) => {
      switch (key.label) {
        case 'Rad':
          setDeg((d) => !d);
          return;
        case 'Inv':
          setInv((v) => !v);
          return;
        case 'AC':
          setExpr('');
          setJustEvaluated(false);
          return;
        case '⌫':
          setExpr((p) => p.slice(0, -1));
          setJustEvaluated(false);
          return;
        case '=':
          doEquals();
          return;
        case 'Ans':
          if (ansRef.current !== null) append(String(ansRef.current));
          return;
        default: {
          const push = inv && key.invPush ? key.invPush : key.push;
          if (push) append(push);
        }
      }
    },
    [append, doEquals, inv],
  );

  // Physical keyboard support.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); doEquals(); }
      else if (e.key === 'Escape') setExpr('');
      else if (e.key === 'Backspace') setExpr((p) => p.slice(0, -1));
      else if (/^[0-9.+\-*/^%()]$/.test(e.key)) {
        const map: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };
        append(map[e.key] ?? e.key);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [append, doEquals]);

  function render(key: Key) {
    const label =
      key.label === 'Rad' ? (deg ? 'Deg' : 'Rad')
      : inv && key.invLabel ? key.invLabel
      : key.label;
    const active = (key.label === 'Inv' && inv) || (key.label === 'Rad' && deg);
    const base =
      'flex h-11 items-center justify-center rounded-md text-[15px] select-none transition-colors' +
      (key.cls === 'equals' ? ' col-span-4' : '');
    const tone =
      key.cls === 'equals' ? 'bg-accent text-page hover:opacity-90'
      : key.cls === 'clear' ? 'bg-chip text-alert hover:bg-chiphover font-medium'
      : key.cls === 'op' || key.cls === 'mode' ? 'bg-chip text-ink hover:bg-chiphover'
      : /[0-9.]/.test(key.label) ? 'bg-page text-ink hover:bg-chip border border-line'
      : 'bg-chip text-ink hover:bg-chiphover';
    return (
      <button
        key={key.label}
        type="button"
        aria-label={key.aria ?? label}
        onClick={() => onKey(key)}
        className={`${base} ${tone} ${active ? 'ring-1 ring-accent' : ''}`}
      >
        {label}
      </button>
    );
  }

  return (
    <section className="mb-6 max-w-[652px] overflow-hidden rounded-xl border border-line">
      <div className="bg-[#202124] px-4 py-5 text-right text-white">
        <div className="min-h-[20px] break-all text-sm text-white/60">
          {expr || ' '}
        </div>
        <div className="mt-1 min-h-[40px] break-all text-4xl">
          {preview || (expr ? '' : '0')}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_repeat(4,minmax(0,1fr))] gap-1.5 p-3">
        {/* scientific column spans first 3 cols; number pad the last 4 */}
        <div className="col-span-3 grid grid-cols-3 gap-1.5">{SCI.map(render)}</div>
        <div className="col-span-4 grid grid-cols-4 gap-1.5">{PAD.map(render)}</div>
      </div>
    </section>
  );
}
