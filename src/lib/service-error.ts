import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

/**
 * Server Components call service functions directly and need to turn a
 * thrown domain error into the right Next.js page behavior. This is the
 * one place that translation happens, instead of every page repeating
 * the same try/catch.
 *
 * Not used by Server Actions — those return `{ error: string }` to the
 * form instead of redirecting, since throwing/redirecting out of a
 * mutation loses the user's in-progress form input.
 */
export function handlePageError(error: unknown): never {
  if (error instanceof NotFoundError) notFound();
  if (error instanceof ForbiddenError) redirect("/forbidden");
  throw error;
}
