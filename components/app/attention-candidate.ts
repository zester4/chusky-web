export function attentionCandidateChatHref(candidateId: string, actionId?: string): string {
  const query = new URLSearchParams({ new: "1", candidate: candidateId });
  if (actionId) {
    query.set("candidateAction", actionId);
    query.set("auto", "1");
  }
  return `/app/chat?${query.toString()}`;
}

export const fallbackAttentionCandidateAction = {
  id: "review",
  label: "Review",
  prompt: "Open this suggestion in Chat, explain the safest next step, and ask for approval before any consequential action.",
};
