/**
 * The time zone the gym operates in, for every date and time the app
 * *displays*.
 *
 * Pages format dates on the server, and a server's own zone is arbitrary:
 * a developer's laptop uses its local zone, but Vercel's servers always
 * run in UTC — so without this, every time shown in production (check-ins,
 * payments, "Good morning") would be off by the gym's UTC offset.
 *
 * Set APP_TIME_ZONE to an IANA name such as "Asia/Kathmandu". Unset (or
 * invalid, which is reported once), formatting falls back to the server's
 * own zone, so local development behaves exactly as before.
 *
 * (Why not just set `TZ`? Vercel reserves that variable, and mutating the
 * process-wide zone at runtime depends on Node/Next internals. An explicit
 * `timeZone` option on each format call works the same everywhere.)
 *
 * This only changes how instants are *shown*. Stored values stay UTC, and
 * day boundaries used for "today's attendance" are unchanged (see
 * lib/date.ts and the README's known simplifications).
 */

let cached: { raw: string | undefined; zone: string | undefined } | undefined;

export function appTimeZone(): string | undefined {
  const raw = process.env.APP_TIME_ZONE?.trim() || undefined;
  if (cached && cached.raw === raw) return cached.zone;

  let zone: string | undefined;
  if (raw) {
    try {
      // Throws RangeError for an unknown zone.
      new Intl.DateTimeFormat("en-US", { timeZone: raw });
      zone = raw;
    } catch {
      console.error(
        `APP_TIME_ZONE "${raw}" is not a valid IANA time zone; using the server's zone.`,
      );
    }
  }
  cached = { raw, zone };
  return zone;
}

/** Adds the gym's time zone to `toLocale*String` options, keeping the rest. */
export function zoned(
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions | undefined {
  const timeZone = appTimeZone();
  if (!timeZone) return options;
  return { ...options, timeZone };
}

/** The hour (0–23) on the gym's clock — `date.getHours()` uses the server's. */
export function hourInAppTimeZone(date: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", zoned({ hour: "numeric", hourCycle: "h23" }))
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;
  return Number(hour ?? date.getHours());
}
