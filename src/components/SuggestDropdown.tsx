'use client';

export interface SuggestItem {
  text: string;
  isHistory: boolean;
}

function MagnifierIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-muted" aria-hidden>
      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-muted" aria-hidden>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

export default function SuggestDropdown({
  id,
  items,
  highlight,
  onSelect,
  onRemoveHistory,
}: {
  id: string;
  items: SuggestItem[];
  highlight: number;
  onSelect: (text: string) => void;
  onRemoveHistory?: (text: string) => void;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute left-0 right-0 top-full z-20 rounded-b-[24px] border border-t-0 border-line bg-page pb-2 pt-1 shadow-lg"
    >
      <li aria-hidden className="mx-4 mb-1 border-t border-line" />
      {items.map((item, i) => (
        <li
          key={item.text}
          id={`${id}-option-${i}`}
          role="option"
          aria-selected={i === highlight}
          className={`group/row flex cursor-default items-center gap-3 px-4 py-1.5 text-[15px] text-ink ${
            i === highlight ? 'bg-chip' : 'hover:bg-card'
          }`}
          // preventDefault keeps the input focused so blur doesn't close the
          // dropdown before the click lands
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(item.text)}
        >
          {item.isHistory ? <ClockIcon /> : <MagnifierIcon />}
          <span
            className={`min-w-0 flex-1 truncate ${item.isHistory ? 'text-rvisited' : ''}`}
          >
            {item.text}
          </span>
          {item.isHistory && onRemoveHistory && (
            <button
              type="button"
              aria-label={`Remove ${item.text} from history`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveHistory(item.text);
              }}
              className={`shrink-0 text-[13px] text-accent hover:underline ${
                i === highlight ? 'inline' : 'hidden group-hover/row:inline'
              }`}
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
