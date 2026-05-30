export function formatRelativeTime(value?: Date | string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  const deltaMs = date.getTime() - Date.now();
  const absSec = Math.round(Math.abs(deltaMs) / 1000);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSec < 60) {
    return formatter.format(Math.round(deltaMs / 1000), "second");
  }

  const absMin = Math.round(absSec / 60);
  if (absMin < 60) {
    return formatter.format(Math.round(deltaMs / 60_000), "minute");
  }

  const absHour = Math.round(absMin / 60);
  if (absHour < 48) {
    return formatter.format(Math.round(deltaMs / 3_600_000), "hour");
  }

  return formatter.format(Math.round(deltaMs / 86_400_000), "day");
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDuration(start?: Date | string | null, end?: Date | string | null) {
  if (!start) {
    return "Unknown";
  }

  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((endMs - startMs) / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function hostAndRepo(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    return `${url.hostname}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return repoUrl;
  }
}
