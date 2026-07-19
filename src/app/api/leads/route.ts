import { NextResponse } from "next/server";
import { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

export async function GET() {
  const user = await ensureDemoWorkspace();
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ ok: true, leads });
}

export async function POST(request: Request) {
  const user = await ensureDemoWorkspace();
  const body = await request.json();

  if (!body.firstName || !body.lastName) {
    return NextResponse.json(
      { ok: false, error: "firstName and lastName are required" },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.create({
    data: {
      userId: user.id,
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      email: body.email ? String(body.email) : null,
      phone: body.phone ? String(body.phone) : null,
      source: parseEnum(LeadSource, body.source, LeadSource.WEBSITE),
      status: parseEnum(LeadStatus, body.status, LeadStatus.NEW),
      priority: parseEnum(LeadPriority, body.priority, LeadPriority.MEDIUM),
      budgetMin: body.budgetMin ? Number(body.budgetMin) : null,
      budgetMax: body.budgetMax ? Number(body.budgetMax) : null,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
      bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
      propertyType: body.propertyType ? String(body.propertyType) : null,
      location: body.location ? String(body.location) : null,
      timeline: body.timeline ? String(body.timeline) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  return NextResponse.json({ ok: true, lead }, { status: 201 });
}
