'use client';

import { useEffect, useRef, useState } from 'react';

function fmt(totalMs: number, showCentis = false): string {
  const total = Math.max(0, totalMs);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return showCentis ? `${base}.${pad(cs)}` : base;
}

function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // audio not available — silent completion
  }
}

export default function TimeWidget({ mode, seconds }: { mode: 'timer' | 'stopwatch'; seconds?: number }) {
  const durationMs = (seconds ?? 0) * 1000;
  const [remaining, setRemaining] = useState(durationMs); // timer
  const [elapsed, setElapsed] = useState(0); // stopwatch
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const anchorRef = useRef(0); // Date.now() reference at last start
  const baseRef = useRef(0); // accumulated value at last pause

  useEffect(() => {
    if (!running) return;
    anchorRef.current = Date.now();
    const id = setInterval(() => {
      const delta = Date.now() - anchorRef.current;
      if (mode === 'stopwatch') {
        setElapsed(baseRef.current + delta);
      } else {
        const left = baseRef.current - delta;
        if (left <= 0) {
          setRemaining(0);
          setRunning(false);
          setDone(true);
          beep();
        } else {
          setRemaining(left);
        }
      }
    }, 47);
    return () => clearInterval(id);
  }, [running, mode]);

  function start() {
    if (mode === 'timer' && remaining <= 0) return;
    baseRef.current = mode === 'timer' ? remaining : elapsed;
    setDone(false);
    setRunning(true);
  }
  function pause() {
    baseRef.current = mode === 'timer' ? remaining : elapsed;
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setDone(false);
    setRemaining(durationMs);
    setElapsed(0);
    baseRef.current = 0;
  }

  const value = mode === 'timer' ? remaining : elapsed;
  const title = mode === 'timer' ? 'Timer' : 'Stopwatch';

  return (
    <section className="mb-6 max-w-[652px] rounded-xl border border-line p-6 text-center">
      <h2 className="mb-4 text-sm font-medium text-muted">{title}</h2>
      <div
        className={`font-mono text-6xl tabular-nums ${done ? 'text-[#d93025]' : 'text-ink'}`}
      >
        {fmt(value, mode === 'stopwatch')}
      </div>
      {done && <div className="mt-2 text-sm text-[#d93025]">Time&apos;s up!</div>}
      <div className="mt-5 flex justify-center gap-3">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-accent px-6 py-2 text-sm text-page hover:opacity-90"
          >
            {mode === 'timer' && remaining < durationMs && !done ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="rounded-full bg-chip px-6 py-2 text-sm text-ink hover:bg-chiphover"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-line px-6 py-2 text-sm text-ink hover:bg-chip"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
