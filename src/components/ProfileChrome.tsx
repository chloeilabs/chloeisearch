/** Decorative top-right chrome (apps grid + avatar), Google-style. */
export default function ProfileChrome() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        title="Apps"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-chip"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-muted" aria-hidden>
          {[4, 12, 20].flatMap((cy) =>
            [4, 12, 20].map((cx) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.1" />
            )),
          )}
        </svg>
      </span>
      <span
        title="labs@chloei.ai"
        className="inline-flex h-8 w-8 select-none items-center justify-center rounded-full bg-[#7b1fa2] text-sm font-medium text-white"
      >
        L
      </span>
    </div>
  );
}
