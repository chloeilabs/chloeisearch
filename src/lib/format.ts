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
