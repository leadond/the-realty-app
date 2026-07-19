import { NextResponse } from "next/server";
import { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { parseCSV } from "@/lib/csv";

const MAX_ROWS = 2000;

function parseEnum<T extends Record<string, string>>(source: T, value: unknown, fallback: T[keyof T]) {
  return typeof value === "string" && Object.values(source).includes(value.toUpperCase())
    ? (value.toUpperCase() as T[keyof T])
    : fallback;
}

/**
 * Universal CSV import: unlike /api/crm/import (fixed column order for our
 * own export format), this accepts a user-defined field mapping so leads
 * exported from any CRM — with any header names — can be imported.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const csvContent = String(body.csvContent || "");
  const mapping: Record<string, string> = body.mapping || {};
  const dedupe = body.dedupe === "update" ? "update" : "skip";

  if (!csvContent) return NextResponse.json({ ok: false, error: "csvContent is required" }, { status: 400 });
  if (!mapping.firstName && !mapping.lastName) {
    return NextResponse.json({ ok: false, error: "Map at least firstName or lastName" }, { status: 400 });
  }

  const { headers, rows } = parseCSV(csvContent);
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "No data rows found in file" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ ok: false, error: `File has ${rows.length} rows; max supported is ${MAX_ROWS} per import` }, { status: 400 });
  }

  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => { headerIndex[h] = i; });

  const getField = (row: string[], ourField: string): string | undefined => {
    const csvHeader = mapping[ourField];
    if (!csvHeader) return undefined;
    const idx = headerIndex[csvHeader];
    return idx === undefined ? undefined : row[idx];
  };

  const job = await prisma.importJob.create({
    data: {
      userId: user.id,
      sourceType: "manual_csv",
      totalRecords: rows.length,
      status: "IN_PROGRESS",
    },
  });

  let imported = 0;
  let skipped = 0;
  let errored = 0;
  const errors: { recordNumber: number; errorMessage: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const firstName = getField(row, "firstName") || getField(row, "lastName") || "Unknown";
      const lastName = getField(row, "lastName") || "";
      const email = getField(row, "email") || null;
      const phone = getField(row, "phone") || null;

      if (!firstName && !lastName) {
        skipped++;
        continue;
      }

      let existing = null;
      if (email) existing = await prisma.lead.findFirst({ where: { userId: user.id, email } });
      if (!existing && phone) existing = await prisma.lead.findFirst({ where: { userId: user.id, phone } });

      const data = {
        firstName,
        lastName,
        email,
        phone,
        source: parseEnum(LeadSource, getField(row, "source"), LeadSource.OTHER),
        status: parseEnum(LeadStatus, getField(row, "status"), LeadStatus.NEW),
        priority: parseEnum(LeadPriority, getField(row, "priority"), LeadPriority.MEDIUM),
        budgetMin: (() => { const v = getField(row, "budgetMin"); return v ? Number(v) || null : null; })(),
        budgetMax: (() => { const v = getField(row, "budgetMax"); return v ? Number(v) || null : null; })(),
        location: getField(row, "location") || null,
        notes: getField(row, "notes") || null,
      };

      if (existing) {
        if (dedupe === "update") {
          await prisma.lead.update({ where: { id: existing.id }, data });
          imported++;
        } else {
          skipped++;
        }
        continue;
      }

      await prisma.lead.create({
        data: { ...data, userId: user.id, organizationId: user.organizationId },
      });
      imported++;
    } catch (e) {
      errored++;
      errors.push({ recordNumber: i + 1, errorMessage: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      recordsImported: imported,
      recordsSkipped: skipped,
      recordsErrored: errored,
      completedAt: new Date(),
    },
  });

  if (errors.length > 0) {
    await prisma.importError.createMany({
      data: errors.slice(0, 100).map((e) => ({ jobId: job.id, ...e })),
    });
  }

  return NextResponse.json({ ok: true, jobId: job.id, imported, skipped, errored });
}
