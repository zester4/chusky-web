const INTERNAL_ERROR_PATTERNS = [
  /durable session domain/i,
  /sdk\.sdkthreads/i,
  /\bneondb_owner\b/i,
  /password authentication failed/i,
  /\/app\/dist\//i,
  /\bat async\b/i,
  /stack trace/i,
  /openrouter/i,
  /provider returned error/i,
  /input_schema does not support/i,
  /previous_errors/i,
  /request_id/i,
];

const PROVIDER_RECOVERY_MESSAGE = "Chusky couldn’t complete that step right now. Your conversation is safe — try again, or choose another approach.";

const isInternalError = (message: string) => INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));

export const INTERNAL_SESSION_RECOVERY_MESSAGE = "Chusky is reconnecting your session. Please try again in a moment.";

export function safeUserFacingError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return message && !isInternalError(message) ? message : fallback;
}

export function safeRunFailure(failure?: { code?: string; message?: string }): { code?: string; message?: string } | undefined {
  if (!failure) return undefined;
  if (failure.message && isInternalError(failure.message)) {
    const message = /openrouter|provider returned error|input_schema does not support|previous_errors|request_id/i.test(failure.message) ? PROVIDER_RECOVERY_MESSAGE : INTERNAL_SESSION_RECOVERY_MESSAGE;
    return { ...(failure.code ? { code: failure.code } : {}), message };
  }
  return failure;
}

