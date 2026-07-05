'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { historyMatches, removeFromHistory, saveToHistory } from '../lib/history';
import { buildSearchUrl } from '../lib/params';
import type { SearchQuery } from '../lib/types';
import SuggestDropdown, { type SuggestItem } from './SuggestDropdown';
import VoiceSearch from './VoiceSearch';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const MAX_ITEMS = 8;

const DEFAULT_QUERY: SearchQuery = {
  q: '',
  tab: 'all',
  page: 1,
  safesearch: 'moderate',
};

export default function SearchBox({
  variant,
  query,
}: {
  variant: 'home' | 'header';
  query?: SearchQuery;
}) {
  const router = useRouter();
  const listId = useId();
  const base = query ?? DEFAULT_QUERY;

  // `typed` is what the user actually typed; `value` is what the input shows
  // (arrow-keying through suggestions fills the input without re-fetching).
  const [typed, setTyped] = useState(base.q);
  const [value, setValue] = useState(base.q);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const suggestDisabledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Back/forward or tab/filter navigation changes the URL query — resync
  // during render (React's "adjusting state when props change" pattern).
  const [prevBaseQ, setPrevBaseQ] = useState(base.q);
  if (prevBaseQ !== base.q) {
    setPrevBaseQ(base.q);
    setTyped(base.q);
    setValue(base.q);
    setHighlight(-1);
    setOpen(false);
  }

  /** Recompute instant, local-only derived state (history rows). */
  function syncLocal(q: string) {
    const trimmed = q.trim();
    setHistoryItems(historyMatches(trimmed, trimmed ? 3 : MAX_ITEMS));
    if (trimmed.length < MIN_CHARS) setApiSuggestions([]);
  }

  // "/" focuses the search box, like google.com.
  useEffect(() => {
    function onSlash(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener('keydown', onSlash);
    return () => window.removeEventListener('keydown', onSlash);
  }, []);

  // Debounced suggest fetch, keyed off the typed text. Gated on `open` so a
  // page load doesn't fire a suggest call for the URL's query before the
  // user ever touches the box.
  useEffect(() => {
    if (!open) return;
    const q = typed.trim();
    if (q.length < MIN_CHARS || suggestDisabledRef.current) return;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data: { suggestions?: string[]; disabled?: boolean } =
          await res.json();
        if (data.disabled) suggestDisabledRef.current = true;
        setApiSuggestions(
          Array.isArray(data.suggestions) ? data.suggestions : [],
        );
      } catch {
        // aborted mid-typing or transient failure — suggestions are best-effort
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed, open]);

  const items: SuggestItem[] = [
    ...historyItems.map((text) => ({ text, isHistory: true })),
    ...apiSuggestions
      .filter(
        (s) => !historyItems.some((h) => h.toLowerCase() === s.toLowerCase()),
      )
      .map((text) => ({ text, isHistory: false })),
  ].slice(0, MAX_ITEMS);

  const showDropdown = open && items.length > 0;

  function navigate(q: string) {
    const target = q.trim();
    if (!target) return;
    saveToHistory(target);
    setOpen(false);
    inputRef.current?.blur();
    // A new query resets pagination and any verbatim-search flag.
    router.push(
      buildSearchUrl({ ...base, q: target }, { page: 1, nospell: undefined }),
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (showDropdown) {
        e.preventDefault();
        setValue(typed);
        setHighlight(-1);
        setOpen(false);
      }
      return;
    }
    if (!showDropdown) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      // Positions cycle through -1 (the typed text) and each suggestion.
      const count = items.length + 1;
      const next = ((highlight + 1 + delta + count) % count) - 1;
      setHighlight(next);
      setValue(next === -1 ? typed : items[next].text);
    }
  }

  // border-b-transparent: while the dropdown is attached, the box's own
  // bottom border would double up with the dropdown's inset divider.
  const boxShape = showDropdown
    ? 'rounded-t-[24px] border-b-transparent shadow-lg'
    : 'rounded-full hover:shadow-md focus-within:shadow-md';

  return (
    // min-w-0 lets the box shrink inside the header row on narrow screens
    // (the input's intrinsic size would otherwise push the page wider).
    <form
      action="/search"
      method="GET"
      role="search"
      className={`w-full min-w-0 ${variant === 'home' ? 'max-w-[584px]' : 'max-w-[692px]'}`}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(value);
      }}
    >
      <div className="relative">
      <div
        className={`flex items-center border border-line bg-page px-4 ${
          variant === 'home' ? 'h-[46px]' : 'h-[44px]'
        } ${boxShape}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-muted" aria-hidden>
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          name="q"
          value={value}
          onChange={(e) => {
            setTyped(e.target.value);
            setValue(e.target.value);
            setHighlight(-1);
            setOpen(true);
            syncLocal(e.target.value);
          }}
          onFocus={() => {
            setOpen(true);
            syncLocal(typed);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={
            highlight >= 0 ? `${listId}-option-${highlight}` : undefined
          }
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
          autoFocus={variant === 'home'}
          className="min-w-0 flex-1 px-3 text-base text-ink outline-none"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setTyped('');
              setValue('');
              setHighlight(-1);
              syncLocal('');
              inputRef.current?.focus();
            }}
            className="shrink-0 p-1 text-muted hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
        <VoiceSearch onResult={navigate} withDivider={Boolean(value)} />
      </div>

      {showDropdown && (
        <SuggestDropdown
          id={listId}
          items={items}
          highlight={highlight}
          onSelect={navigate}
          onRemoveHistory={(text) => {
            removeFromHistory(text);
            setHighlight(-1);
            syncLocal(typed);
          }}
        />
      )}
      </div>

      {/* Non-JS fallback: preserve the current tab and filters on submit. */}
      {base.tab !== 'all' && <input type="hidden" name="tab" value={base.tab} />}
      {base.freshness && (
        <input type="hidden" name="freshness" value={base.freshness} />
      )}
      {base.safesearch !== 'moderate' && (
        <input type="hidden" name="safesearch" value={base.safesearch} />
      )}
      {base.country && (
        <input type="hidden" name="country" value={base.country.toLowerCase()} />
      )}

      {variant === 'home' && (
        <div className="mt-7 flex justify-center gap-3">
          <button
            type="submit"
            className="rounded bg-card px-4 py-2 text-sm text-ink hover:border hover:border-line hover:shadow-sm"
          >
            Search
          </button>
          <button
            type="submit"
            formAction="/lucky"
            onClick={(e) => {
              e.preventDefault();
              const target = value.trim();
              if (!target) return;
              saveToHistory(target);
              window.location.assign(`/lucky?q=${encodeURIComponent(target)}`);
            }}
            className="rounded bg-card px-4 py-2 text-sm text-ink hover:border hover:border-line hover:shadow-sm"
          >
            I&apos;m Feeling Lucky
          </button>
        </div>
      )}
    </form>
  );
}
