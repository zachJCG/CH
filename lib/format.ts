/** 205 → "3h 25m" · 45 → "45m" · 120 → "2h" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Estimate chip text: "~45m" (or "—" when unset). */
export function formatEstimate(minutes: number | null): string {
  return minutes == null ? "—" : `~${formatMinutes(minutes)}`;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
