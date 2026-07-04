'use client';

import { useCallback, useState } from 'react';

const DICE_PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

type Props =
  | { kind: 'coin' }
  | { kind: 'dice'; count: number; sides: number }
  | { kind: 'random'; min: number; max: number };

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initialValues(props: Props): number[] {
  if (props.kind === 'dice') {
    return Array.from({ length: props.count }, () => randInt(1, props.sides));
  }
  if (props.kind === 'random') return [randInt(props.min, props.max)];
  return [];
}

export default function RandomWidget(props: Props) {
  // Lazy initializers give an immediate result on mount (like Google) without
  // a setState-in-effect. Server/client randomness differs by design, so the
  // result container is marked suppressHydrationWarning.
  const [values, setValues] = useState<number[]>(() => initialValues(props));
  const [coin, setCoin] = useState<'Heads' | 'Tails' | null>(() =>
    props.kind === 'coin' ? (Math.random() < 0.5 ? 'Heads' : 'Tails') : null,
  );
  const [spinning, setSpinning] = useState(false);

  const roll = useCallback(() => {
    setSpinning(true);
    if (props.kind === 'coin') {
      setCoin(Math.random() < 0.5 ? 'Heads' : 'Tails');
    } else {
      setValues(initialValues(props));
    }
    setTimeout(() => setSpinning(false), 300);
  }, [props]);

  const title =
    props.kind === 'coin' ? 'Flip a coin'
    : props.kind === 'dice' ? `Roll ${props.count > 1 ? props.count + ' dice' : 'a die'}${props.sides !== 6 ? ` (d${props.sides})` : ''}`
    : `Random number (${props.min}–${props.max})`;

  const actionLabel =
    props.kind === 'coin' ? 'Flip again'
    : props.kind === 'dice' ? 'Roll again'
    : 'Generate';

  const total = props.kind === 'dice' && props.count > 1
    ? values.reduce((a, v) => a + v, 0)
    : null;

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-6 text-center">
      <h2 className="mb-4 text-sm font-medium text-muted">{title}</h2>
      <div
        suppressHydrationWarning
        className={`flex flex-wrap items-center justify-center gap-3 ${spinning ? 'opacity-60' : ''} transition-opacity`}
      >
        {props.kind === 'coin' && (
          <div className="text-5xl font-medium text-ink">{coin}</div>
        )}
        {props.kind === 'dice' &&
          values.map((v, i) =>
            props.sides === 6 ? (
              <span key={i} className="text-6xl leading-none text-accent">{DICE_PIPS[v]}</span>
            ) : (
              <span key={i} className="flex h-14 w-14 items-center justify-center rounded-lg border border-line text-2xl text-ink">
                {v}
              </span>
            ),
          )}
        {props.kind === 'random' && (
          <div className="text-6xl font-medium text-ink">{values[0]}</div>
        )}
      </div>
      {total !== null && (
        <div className="mt-3 text-sm text-muted">Total: {total}</div>
      )}
      <button
        type="button"
        onClick={roll}
        className="mt-5 rounded-full bg-accent px-6 py-2 text-sm text-page hover:opacity-90"
      >
        {actionLabel}
      </button>
    </section>
  );
}
