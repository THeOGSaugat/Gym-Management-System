/**
 * Base class for errors we expect and want to handle gracefully
 * (as opposed to unexpected bugs, which should surface as 500s and get logged).
 *
 * Every domain-specific error (NotFoundError, ForbiddenError, ValidationError, ...)
 * extends this so route handlers can catch `AppError` once and map it to the
 * right HTTP status, instead of every route re-implementing that mapping.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do this") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "This conflicts with existing data") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * Narrow an unknown catch-block value down to a safe { message, statusCode, code }
 * shape for API responses, without ever leaking internals (stack traces, raw
 * DB errors) to the client.
 */
export function toErrorResponse(error: unknown): {
  message: string;
  statusCode: number;
  code: string;
} {
  if (error instanceof AppError) {
    return { message: error.message, statusCode: error.statusCode, code: error.code };
  }

  // Anything else is a bug, not an expected failure — don't leak its details.
  console.error("Unhandled error:", error);
  return {
    message: "Something went wrong. Please try again.",
    statusCode: 500,
    code: "INTERNAL_ERROR",
  };
}
