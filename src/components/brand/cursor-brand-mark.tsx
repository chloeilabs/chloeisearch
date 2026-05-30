import { cn } from "@/lib/utils";

/** Abstract mark for Chloei Code — evoking Cursor’s cube motif without using their logo. */
export function CursorBrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimension =
    size === "sm" ? 28 : size === "lg" ? 40 : 32;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-border/70 bg-card shadow-sm shadow-black/25",
        className
      )}
      style={{ width: dimension, height: dimension }}
      aria-hidden
    >
      <svg
        width={dimension * 0.55}
        height={dimension * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L20 8V16L12 21L4 16V8L12 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/90"
        />
        <path
          d="M12 8L16 10.5V14.5L12 17L8 14.5V10.5L12 8Z"
          fill="currentColor"
          className="text-foreground"
        />
      </svg>
    </span>
  );
}
