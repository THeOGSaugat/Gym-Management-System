/**
 * Formats a Date as "yyyy-mm-dd" in UTC, the value an
 * `<input type="date">` expects for its `defaultValue`. Using UTC getters
 * (not local) avoids the date shifting by a day depending on the server's
 * timezone — dateOfBirth is stored as a date, not a date-time, so its
 * calendar day should never move.
 */
export function toDateInputValue(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Midnight UTC of the calendar day `date` falls on. Used to compute
 * Attendance.attendanceDate from a server-generated check-in timestamp —
 * always from the server's own `new Date()`, never from client input
 * (see attendance.service.ts). UTC, not local time, for the same reason
 * the rest of this codebase's date math avoids timezone-dependent
 * "today" — there's no per-gym timezone setting yet, and a fixed
 * reference point keeps every server instance computing the same day
 * for the same instant.
 */
export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
