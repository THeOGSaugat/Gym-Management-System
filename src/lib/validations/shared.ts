import { z } from "zod";

/**
 * A rendered HTML form's empty text input still submits as "" for that
 * field name. But FormData.get() returns `null` for a key that isn't
 * present at all — which happens for any caller that isn't a full render
 * of our own form (a hand-built request, a future API client, a field
 * removed by a future edit to the form). Treating only "" as "empty" and
 * leaving `null` to fail validation would make the schema's behavior
 * depend on how the request was constructed, not on the data.
 *
 * This one function is the single place that rule lives — every
 * `optional*` helper below (and any future one) builds on it, precisely
 * so it's defined once and reused, not re-typed slightly differently
 * per schema file. (An earlier version of this fix was duplicated by
 * hand into a second schema file and only handled "", not `null` —
 * found by a failing test, not by inspection. Don't repeat that: import
 * from here instead of writing a new local `isBlank`/`optionalX`.)
 */
export function isBlank(value: unknown): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

export function optionalTrimmedString(maxLength: number) {
  return z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.string().trim().max(maxLength).optional(),
  );
}

export function optionalDate() {
  return z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z.coerce.date().optional(),
  );
}
