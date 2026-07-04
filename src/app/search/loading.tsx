export default function Loading() {
  return (
    <div className="px-4 pt-6 sm:px-6 lg:pl-[164px]">
      <div className="max-w-[600px] animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-8">
            <div className="mb-2 h-4 w-1/3 rounded bg-chip" />
            <div className="mb-2 h-5 w-2/3 rounded bg-chip" />
            <div className="h-4 w-full rounded bg-chip" />
          </div>
        ))}
      </div>
    </div>
  );
}
