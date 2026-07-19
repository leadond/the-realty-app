export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Send a chat conversation to the AI and return the assistant's text reply.
 * Runs through the /api/ai/chat server route so the Anthropic API key stays
 * on the server and is never exposed to the browser.
 */
export async function callAIChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || `AI request failed (${res.status})`);
  }

  return String(data.content ?? "");
}

/** Convenience wrapper for a single-prompt request. */
export async function callAI(prompt: string): Promise<string> {
  return callAIChat([{ role: "user", content: prompt }]);
}
