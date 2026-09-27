import test from "node:test";
import assert from "node:assert/strict";
import { unrepresentedAccountHistory } from "../lib/account-history";

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
