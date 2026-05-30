export const taskSummaryMaxLength = 120;

export function truncateTaskSummary(
  value: string,
  maxLength = taskSummaryMaxLength
) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getValidRenameSummary({
  draftSummary,
  originalSummary,
}: {
  draftSummary: string;
  originalSummary: string;
}) {
  const normalized = draftSummary.replace(/\s+/g, " ").trim();
  const originalNormalized = originalSummary.replace(/\s+/g, " ").trim();

  if (!normalized || normalized === originalNormalized) {
    return null;
  }

  return truncateTaskSummary(normalized);
}
