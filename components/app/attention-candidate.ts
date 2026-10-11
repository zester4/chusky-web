export function attentionCandidateChatHref(candidateId: string, actionId?: string): string {
  // Elena suggestions are a handoff into the owner's current conversation.
  // Do not add `new=1`: ChatPage uses that flag to create a fresh thread.
  const query = new URLSearchParams({ candidate: candidateId, attentionSource: "elena" });
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
