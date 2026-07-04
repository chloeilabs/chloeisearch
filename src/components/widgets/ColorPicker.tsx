'use client';

import { useState } from 'react';

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();

export default function ColorPicker() {
  const [h, setH] = useState(217);
  const [s, setS] = useState(89);
  const [l, setL] = useState(61);
  const [r, g, b] = hslToRgb(h, s, l);
  const hex = toHex(r, g, b);

  const rows: [string, string][] = [
    ['HEX', hex],
    ['RGB', `rgb(${r}, ${g}, ${b})`],
    ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
  ];

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-4">
      <h2 className="mb-3 text-sm font-medium text-muted">Color picker</h2>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div
          className="h-40 w-full rounded-lg border border-line sm:w-40"
          style={{ background: `hsl(${h}, ${s}%, ${l}%)` }}
        />
        <div className="flex-1">
          <Slider label="Hue" value={h} max={360} onChange={setH}
            track="linear-gradient(to right,red,#ff0,#0f0,#0ff,#00f,#f0f,red)" />
          <Slider label="Saturation" value={s} max={100} onChange={setS}
            track={`linear-gradient(to right,hsl(${h},0%,${l}%),hsl(${h},100%,${l}%))`} />
          <Slider label="Lightness" value={l} max={100} onChange={setL}
            track={`linear-gradient(to right,#000,hsl(${h},${s}%,50%),#fff)`} />
        </div>
      </div>
      <dl className="mt-4 space-y-2 border-t border-line pt-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center gap-3">
            <dt className="w-12 text-sm text-muted">{label}</dt>
            <dd className="flex-1">
              <code className="rounded bg-chip px-2 py-1 text-sm text-ink">{value}</code>
            </dd>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(value)}
              className="text-sm text-accent hover:underline"
            >
              Copy
            </button>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Slider({
  label, value, max, onChange, track,
}: {
  label: string; value: number; max: number; onChange: (v: number) => void; track: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{ background: track }}
      />
    </label>
  );
}
