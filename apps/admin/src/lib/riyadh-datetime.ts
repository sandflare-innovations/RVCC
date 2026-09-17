/** Bid windows are composed in Asia/Riyadh (UTC+3, no DST). */

const RIYADH = "Asia/Riyadh";

export function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RIYADH,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Treat datetime-local wall clock as Riyadh, then send ISO to the API. */
export function datetimeLocalToIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  return `${withSeconds}+03:00`;
}

/** Split an ISO timestamp into Riyadh date + HH:mm for separate form fields. */
export function splitRiyadhParts(iso?: string | null): { date: string; time: string } {
  const local = isoToDatetimeLocal(iso);
  const [date = "", time = ""] = local.split("T");
  return { date, time: time.slice(0, 5) };
}

/** Compose Riyadh date + time fields into an API ISO timestamp. */
export function composeRiyadhIso(date: string, time: string): string | undefined {
  if (!date.trim() || !time.trim()) return undefined;
  return datetimeLocalToIso(`${date.trim()}T${time.trim()}`);
}

/** Human duration between two Riyadh date/time pairs. */
export function riyadhWindowDuration(openDate: string, openTime: string, closeDate: string, closeTime: string): string {
  const opensAt = composeRiyadhIso(openDate, openTime);
  const closesAt = composeRiyadhIso(closeDate, closeTime);
  if (!opensAt || !closesAt) return "";
  const ms = new Date(closesAt).getTime() - new Date(opensAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "Invalid window";
  const minutes = Math.round(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours && rem) return `${hours}h ${rem}m`;
  if (hours) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
