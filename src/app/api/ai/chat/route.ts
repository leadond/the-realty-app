import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { callAnthropic, callGemini, estimateCostUSD, type ChatMessage } from "@/lib/ai/providers";

/**
 * Server-side AI proxy. Tries Gemini first (lower cost); if it's not
 * configured or errors (rate limit, outage), falls back to Anthropic Claude
 * when ANTHROPIC_API_KEY is set. Keeps both API keys server-side and
 * enforces a monthly token budget per user (aiTier / monthlyTokenLimit) so
 * a single account can't run up unbounded API cost.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!geminiConfigured && !anthropicConfigured) {
    return NextResponse.json(
      {
        error:
          "AI is not configured. Add a GEMINI_API_KEY (and optionally ANTHROPIC_API_KEY as a fallback) environment variable in Vercel and redeploy.",
      },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; system?: string; maxTokens?: number; feature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "A messages array is required" }, { status: 400 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.aIUsage.aggregate({
    where: { userId: user.id, createdAt: { gte: startOfMonth } },
    _sum: { totalTokens: true },
  });
  const usedTokens = usage._sum.totalTokens ?? 0;

  if (usedTokens >= user.monthlyTokenLimit) {
    return NextResponse.json(
      {
        error: `Monthly AI usage limit reached (${user.monthlyTokenLimit.toLocaleString()} tokens on the ${user.aiTier} tier). It resets next month.`,
      },
      { status: 429 },
    );
  }

  const callOptions = { system: body.system, maxTokens: body.maxTokens };
  let result;
  let usedProvider = "gemini";

  try {
    if (!geminiConfigured) throw new Error("GEMINI_NOT_CONFIGURED");
    result = await callGemini(messages, callOptions);
  } catch (geminiError) {
    if (!anthropicConfigured) {
      const message = geminiError instanceof Error ? geminiError.message : "AI request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
    try {
      usedProvider = "anthropic";
      result = await callAnthropic(messages, callOptions);
    } catch (anthropicError) {
      const message = anthropicError instanceof Error ? anthropicError.message : "AI request failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const totalTokens = result.inputTokens + result.outputTokens;
  await prisma.aIUsage.create({
    data: {
      userId: user.id,
      model: `${usedProvider}:${result.model}`,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens,
      costUSD: estimateCostUSD(result.model, result.inputTokens, result.outputTokens),
      feature: body.feature || null,
    },
  });

  return NextResponse.json({ content: result.content, provider: usedProvider });
}
