import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";

/**
 * Consistent success envelope for API route handlers.
 */
export function apiSuccess<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ ok: true, data }, { status: init?.status ?? 200 });
}

/**
 * Consistent error envelope. Pass the value caught in a try/catch — it will
 * be mapped to the right status code if it's an AppError, or treated as an
 * unexpected 500 otherwise.
 */
export function apiError(error: unknown) {
  const { message, statusCode, code } = toErrorResponse(error);
  return NextResponse.json({ ok: false, error: { message, code } }, { status: statusCode });
}
