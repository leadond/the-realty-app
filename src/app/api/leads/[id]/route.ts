import { NextResponse } from "next/server";
import { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseEnum<T extends Record<string, string>>(source: T, value: unknown) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, lead });
}

export async function PATCH(request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  const body = await request.json();

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      firstName: body.firstName ? String(body.firstName) : undefined,
      lastName: body.lastName ? String(body.lastName) : undefined,
      email: body.email === undefined ? undefined : body.email ? String(body.email) : null,
      phone: body.phone === undefined ? undefined : body.phone ? String(body.phone) : null,
      source: parseEnum(LeadSource, body.source),
      status: parseEnum(LeadStatus, body.status),
      priority: parseEnum(LeadPriority, body.priority),
      budgetMin: body.budgetMin === undefined ? undefined : body.budgetMin ? Number(body.budgetMin) : null,
      budgetMax: body.budgetMax === undefined ? undefined : body.budgetMax ? Number(body.budgetMax) : null,
      bedrooms: body.bedrooms === undefined ? undefined : body.bedrooms ? Number(body.bedrooms) : null,
      bathrooms: body.bathrooms === undefined ? undefined : body.bathrooms ? Number(body.bathrooms) : null,
      propertyType: body.propertyType === undefined ? undefined : body.propertyType ? String(body.propertyType) : null,
      location: body.location === undefined ? undefined : body.location ? String(body.location) : null,
      timeline: body.timeline === undefined ? undefined : body.timeline ? String(body.timeline) : null,
      notes: body.notes === undefined ? undefined : body.notes ? String(body.notes) : null,
    },
  });

  return NextResponse.json({ ok: true, lead });
}

export async function DELETE(_request: Request, context: RouteContext) {
  await ensureDemoWorkspace();
  const { id } = await context.params;
  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
