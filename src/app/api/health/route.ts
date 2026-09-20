import { db } from "@/server/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

/**
 * GET /api/health
 *
 * Reports whether the app is up and whether it can reach the database.
 * Useful for confirming local setup and for uptime checks once deployed.
 */
export async function GET() {
  try {
    const startedAt = Date.now();
    await db.$queryRaw`SELECT 1`;

    return apiSuccess({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (cause) {
    console.error("Health check failed to reach the database:", cause);
    return apiError(
      new AppError(
        "Database is unreachable. Check DATABASE_URL in .env.",
        503,
        "DATABASE_UNAVAILABLE",
      ),
    );
  }
}
