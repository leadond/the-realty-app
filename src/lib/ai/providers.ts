export type ChatMessage = { role: string; content: string };

export type ProviderResult = {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

// Pinned rather than an auto-updating alias: predictable cost/behavior for
// the balanced price-performance tier. If Google eventually retires this
// model, override with GEMINI_MODEL until the code default is updated.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function splitSystemAndTurns(messages: ChatMessage[], extraSystem?: string) {
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const system = [extraSystem, ...systemParts].filter(Boolean).join("\n\n");
  const turns = messages.filter((m) => m.role === "user" || m.role === "assistant");
  return { system, turns };
}

export async function callAnthropic(
  messages: ChatMessage[],
  options: { system?: string; maxTokens?: number } = {},
): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_NOT_CONFIGURED");

  const { system, turns } = splitSystemAndTurns(messages, options.system);
  if (turns.length === 0) throw new Error("At least one user message is required");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: options.maxTokens ?? 1500,
      ...(system ? { system } : {}),
      messages: turns,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Anthropic API error (${res.status})`);
  }

  const content = Array.isArray(data.content)
    ? data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("")
    : "";

  return {
    content,
    model: ANTHROPIC_MODEL,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

export async function callGemini(
  messages: ChatMessage[],
  options: { system?: string; maxTokens?: number } = {},
): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");

  const { system, turns } = splitSystemAndTurns(messages, options.system);
  if (turns.length === 0) throw new Error("At least one user message is required");

  const contents = turns.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { maxOutputTokens: options.maxTokens ?? 1500 },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini API error (${res.status})`);
  }

  const content = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text || "")
    .join("");

  return {
    content,
    model: GEMINI_MODEL,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/** Rough blended cost estimate for in-app usage visibility (not a real invoice). */
export function estimateCostUSD(model: string, inputTokens: number, outputTokens: number): number {
  const rates: Record<string, { in: number; out: number }> = {
    default: { in: 0.001, out: 0.003 }, // $/1K tokens, conservative mid-tier estimate
  };
  const rate = rates[model] || rates.default;
  return (inputTokens / 1000) * rate.in + (outputTokens / 1000) * rate.out;
}
