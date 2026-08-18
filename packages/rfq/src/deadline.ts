/** Two days. The window in which a supplier still has time to act. */
const URGENT_MS = 48 * 3_600_000;

export type Deadline = { label: string; urgent: boolean; closed: boolean };

/**
 * One deadline vocabulary for both portals. Staff and suppliers reading the
 * same requirement should read the same words for how long is left.
 *
 * `now` is a parameter rather than a call to Date.now() so the behaviour at
 * the 48-hour boundary can be tested without freezing the clock.
 */
export function describeDeadline(closesAt: Date | string, now: Date = new Date()): Deadline {
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (ms <= 0) return { label: "Closed", urgent: false, closed: true };

  const hours = Math.floor(ms / 3_600_000);
  const label = hours < 24 ? `${hours}h left` : `${Math.floor(hours / 24)}d left`;
  return { label, urgent: ms <= URGENT_MS, closed: false };
}
