const INTERNAL_ERROR_PATTERNS = [
  /durable session domain/i,
  /sdk\.sdkthreads/i,
  /\bneondb_owner\b/i,
  /password authentication failed/i,
  /\/app\/dist\//i,
  /\bat async\b/i,
  /stack trace/i,
];

const isInternalError = (message: string) => INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));

export const INTERNAL_SESSION_RECOVERY_MESSAGE = "Chusky is reconnecting your session. Please try again in a moment.";

export function safeUserFacingError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return message && !isInternalError(message) ? message : fallback;
}

export function safeRunFailure(failure?: { code?: string; message?: string }): { code?: string; message?: string } | undefined {
  if (!failure) return undefined;
  if (failure.message && isInternalError(failure.message)) {
    return { ...(failure.code ? { code: failure.code } : {}), message: INTERNAL_SESSION_RECOVERY_MESSAGE };
  }
  return failure;
}

