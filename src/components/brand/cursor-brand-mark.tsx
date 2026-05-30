import { cn } from "@/lib/utils";

export function CursorBrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimension = size === "sm" ? 18 : size === "lg" ? 24 : 20;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-foreground/90", className)}
      aria-hidden
    >
      <path
        d="M12 3L20 8V16L12 21L4 16V8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 8L16 10.5V14.5L12 17L8 14.5V10.5L12 8Z"
        fill="currentColor"
      />
    </svg>
  );
}
