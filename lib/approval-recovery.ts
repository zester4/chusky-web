/** Never infer execution failure or permit replay from a lost HTTP response. */
export function approvalRecoveryState(
  approvalStatus?: "pending" | "approved" | "consumed" | "denied",
  runStatus?: "queued" | "running" | "requires_approval" | "completed" | "failed" | "cancelled",
): "retry" | "run" | "accepted" | "denied" | "unknown" {
  if (runStatus && runStatus !== "requires_approval") return "run";
  if (approvalStatus === "pending") return "retry";
  if (approvalStatus === "approved" || approvalStatus === "consumed") return "accepted";
  if (approvalStatus === "denied") return "denied";
  return "unknown";
}
