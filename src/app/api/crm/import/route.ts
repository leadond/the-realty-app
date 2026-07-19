import { NextResponse } from "next/server";
import { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value)
    ? (value as T[keyof T])
    : fallback;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.csvContent) {
    return NextResponse.json({ ok: false, error: "csvContent is required" }, { status: 400 });
  }

  const lines = body.csvContent.split("\n").filter((l: string) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ ok: false, error: "CSV must have header and at least one data row" }, { status: 400 });
  }

  // Skip header line
  const created = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 2) continue;

    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        firstName: fields[0].split(" ")[0] || "Unknown",
        lastName: fields[0].split(" ").slice(1).join(" ") || "Contact",
        email: fields[1] || null,
        phone: fields[2] || null,
        source: parseEnum(LeadSource, fields[3], LeadSource.OTHER),
        status: parseEnum(LeadStatus, fields[4], LeadStatus.NEW),
        priority: parseEnum(LeadPriority, fields[5], LeadPriority.MEDIUM),
        budgetMin: fields[6] ? Number(fields[6]) : null,
        budgetMax: fields[7] ? Number(fields[7]) : null,
        location: fields[8] || null,
        notes: fields[9] || null,
      },
    });
    created.push(lead.id);
  }

  return NextResponse.json({ ok: true, imported: created.length, ids: created });
}
