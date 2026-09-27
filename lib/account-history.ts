export type AccountHistoryEntry = {
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
};

export type VisibleHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

export type AccountTimelineEntry = AccountHistoryEntry & {
  source: "account" | "thread";
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

/** Merge shared account messages with the open web thread without duplicating turns. */
export function mergeAccountHistoryIntoThread<T extends VisibleHistoryEntry & { createdAt?: number }>(
  accountHistory: readonly AccountHistoryEntry[],
  threadHistory: readonly T[],
): Array<(T & { source: "thread" }) | (AccountHistoryEntry & { source: "account" })> {
  const represented = threadHistory.map(({ role, content }) => ({ role, content }));
  const shared = unrepresentedAccountHistory(accountHistory, represented);
  const entries = [
    ...threadHistory.map((entry) => ({ ...entry, source: "thread" as const })),
    ...shared.map((entry) => ({ ...entry, source: "account" as const })),
  ];
  return entries.sort((left, right) => {
    const leftAt = left.createdAt ?? Number.POSITIVE_INFINITY;
    const rightAt = right.createdAt ?? Number.POSITIVE_INFINITY;
    return leftAt - rightAt;
  });
}
