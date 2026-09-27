export type AccountHistoryEntry = {
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
};

export type VisibleHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

/** Return account-wide messages not already represented in the open thread. */
export function unrepresentedAccountHistory(
  accountHistory: readonly AccountHistoryEntry[],
  visibleThread: readonly VisibleHistoryEntry[],
): AccountHistoryEntry[] {
  const visibleCounts = new Map<string, number>();
  for (const message of visibleThread) {
    const key = `${message.role}\u0000${message.content}`;
    visibleCounts.set(key, (visibleCounts.get(key) ?? 0) + 1);
  }

  return accountHistory.filter((message) => {
    const key = `${message.role}\u0000${message.content}`;
    const count = visibleCounts.get(key) ?? 0;
    if (count === 0) return true;
    visibleCounts.set(key, count - 1);
    return false;
  });
}
