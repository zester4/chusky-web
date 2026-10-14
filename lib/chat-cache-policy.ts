/**
 * Keep recently visited chat timelines in the browser so route changes do not
 * immediately refetch the whole thread from the API. Active runs still use
 * run recovery after the cached timeline is restored.
 */
export const CHAT_RETURN_CACHE_MAX_AGE_MS = 5 * 60_000;

export function shouldUseChatReturnCache(cachedAt: number, now = Date.now()): boolean {
  return cachedAt > 0 && now >= cachedAt && now - cachedAt < CHAT_RETURN_CACHE_MAX_AGE_MS;
}
