import { NextResponse } from "next/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

type ChatMessage = { role: string; content: string };

/**
 * Server-side proxy for AI chat completions. Keeps the Anthropic API key on the
 * server so it is never exposed to the browser. All AI features (listing copy,
 * market research, matchmaker, etc.) call this route via src/lib/ai/provider.ts.
 */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI is not configured. Add an ANTHROPIC_API_KEY environment variable in Vercel (Settings → Environment Variables) and redeploy.",
      },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; system?: string; maxTokens?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "A messages array is required" }, { status: 400 });
  }

  // Anthropic takes the system prompt as a top-level field, not a message role.
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const system = [body.system, ...systemParts].filter(Boolean).join("\n\n");
  const chatMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  if (chatMessages.length === 0) {
    return NextResponse.json(
      { error: "At least one user message is required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: body.maxTokens ?? 1500,
        ...(system ? { system } : {}),
        messages: chatMessages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message || `Anthropic API error (${res.status})`;
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const content = Array.isArray(data.content)
      ? data.content
          .filter((block: { type: string }) => block.type === "text")
          .map((block: { text: string }) => block.text)
          .join("")
      : "";

    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reach the AI provider" },
      { status: 502 },
    );
  }
}
