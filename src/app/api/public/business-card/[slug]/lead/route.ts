import { NextResponse } from "next/server";
import { LeadSource } from "@prisma/client";

import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_FIELD = 200;
const MAX_MESSAGE = 2000;

function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  const firstName = cleanString(input.firstName, MAX_FIELD);
  const lastName = cleanString(input.lastName, MAX_FIELD);
  if (!firstName || !lastName) {
    return NextResponse.json(
      { ok: false, error: "First name and last name are required." },
      { status: 400 },
    );
  }

  const email = cleanString(input.email, MAX_FIELD);
  const phone = cleanString(input.phone, MAX_FIELD);
  const message = cleanString(input.message, MAX_MESSAGE);

  const agent = await prisma.user.findUnique({
    where: { profileSlug: slug },
    select: { id: true },
  });
  if (!agent) {
    return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
  }

  await prisma.lead.create({
    data: {
      userId: agent.id,
      firstName,
      lastName,
      email,
      phone,
      source: LeadSource.WEBSITE,
      notes: message ? `Submitted via digital business card:\n${message}` : "Submitted via digital business card",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
