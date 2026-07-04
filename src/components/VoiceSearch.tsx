'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Minimal local typings — the Web Speech API has no lib.dom types everywhere.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SRConstructor = new () => SpeechRecognitionLike;

function getRecognition(): SRConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const emptySubscribe = () => () => {};

/** Google's multicolor mic. Rendered only when the browser supports it. */
export default function VoiceSearch({
  onResult,
}: {
  onResult: (transcript: string) => void;
}) {
  // SSR-safe capability detection: false on the server, real check on the client.
  const supported = useSyncExternalStore(
    emptySubscribe,
    () => Boolean(getRecognition()),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  if (!supported) return null;

  function start() {
    const SR = getRecognition();
    if (!SR) return;
    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) onResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <button
      type="button"
      aria-label={listening ? 'Stop voice search' : 'Search by voice'}
      title="Search by voice"
      onClick={() => (listening ? recRef.current?.stop() : start())}
      className={`shrink-0 rounded-full p-1 ${listening ? 'animate-pulse bg-[#fce8e6]' : 'hover:bg-card'}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          fill="#4285f4"
          d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"
        />
        <path fill="#34a853" d="M11 18.92h2V22h-2z" />
        <path
          fill="#fbbc05"
          d="M7 12H5c0 1.93.78 3.68 2.05 4.95l1.42-1.42A4.98 4.98 0 0 1 7 12z"
        />
        <path
          fill="#ea4335"
          d="M12 17a4.98 4.98 0 0 1-3.53-1.47l-1.42 1.42A6.98 6.98 0 0 0 12 19c3.87 0 7-3.13 7-7h-2c0 2.76-2.24 5-5 5z"
        />
      </svg>
    </button>
  );
}
