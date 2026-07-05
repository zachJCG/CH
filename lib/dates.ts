import { addDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Today's date ("yyyy-MM-dd") in the org's timezone. */
export function todayInOrgTz(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

/** The org-local calendar day ("yyyy-MM-dd") of a UTC ISO timestamp. */
export function dayInOrgTz(timezone: string, iso: string): string {
  return formatInTimeZone(parseISO(iso), timezone, "yyyy-MM-dd");
}

/** A date offset from today ("yyyy-MM-dd") in the org's timezone. */
export function dateInOrgTz(timezone: string, offsetDays: number): string {
  const today = parseISO(todayInOrgTz(timezone));
  return format(addDays(today, offsetDays), "yyyy-MM-dd");
}

/** Days between two "yyyy-MM-dd" dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseISO(b).getTime() - parseISO(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Combine an org-local date + "HH:mm" into a UTC ISO timestamp. */
export function orgTimeToUtc(
  timezone: string,
  date: string,
  time: string,
): string {
  return fromZonedTime(`${date}T${time}:00`, timezone).toISOString();
}

/** Format a UTC ISO timestamp as a short org-local time, e.g. "3:40 PM". */
export function formatOrgTime(timezone: string, iso: string): string {
  return formatInTimeZone(parseISO(iso), timezone, "h:mm a");
}

/** Human date like "Tue, Mar 4" from "yyyy-MM-dd". */
export function formatDay(date: string): string {
  return format(parseISO(date), "EEE, MMM d");
}

/** Long date like "Tuesday, March 4" from "yyyy-MM-dd". */
export function formatDayLong(date: string): string {
  return format(parseISO(date), "EEEE, MMMM d");
}
