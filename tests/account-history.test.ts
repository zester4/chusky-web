import test from "node:test";
import assert from "node:assert/strict";
import { mergeAccountHistoryIntoThread, unrepresentedAccountHistory } from "../lib/account-history";

test("shared account history omits messages already shown in the active thread", () => {
  const history = [
    { role: "user" as const, content: "Earlier on Telegram" },
    { role: "assistant" as const, content: "I remember" },
    { role: "user" as const, content: "Current web question" },
    { role: "assistant" as const, content: "Current web answer" },
  ];

  assert.deepEqual(unrepresentedAccountHistory(history, history.slice(2)), history.slice(0, 2));
});

test("shared account history preserves repeated identical messages by occurrence", () => {
  const history = [
    { role: "user" as const, content: "Repeat" },
    { role: "assistant" as const, content: "Noted" },
    { role: "user" as const, content: "Repeat" },
  ];

  assert.deepEqual(unrepresentedAccountHistory(history, history.slice(2)), [history[1], history[2]]);
});

test("shared account history distinguishes roles and exact message content", () => {
  const history = [
    { role: "user" as const, content: "Same text" },
    { role: "assistant" as const, content: "Same text" },
  ];

  assert.deepEqual(unrepresentedAccountHistory(history, [{ role: "user", content: "Same text" }]), [history[1]]);
});

test("shared channel messages appear in the same chronological timeline as the open web thread", () => {
  const web = [
    { role: "user" as const, content: "Web question", createdAt: 20 },
    { role: "assistant" as const, content: "Web answer", createdAt: 40 },
  ];
  const account = [
    { role: "user" as const, content: "Telegram question", createdAt: 10 },
    ...web,
    { role: "assistant" as const, content: "Telegram answer", createdAt: 30 },
  ];

  assert.deepEqual(mergeAccountHistoryIntoThread(account, web), [
    { ...account[0], source: "account" },
    { ...web[0], source: "thread" },
    { ...account[3], source: "account" },
    { ...web[1], source: "thread" },
  ]);
});
