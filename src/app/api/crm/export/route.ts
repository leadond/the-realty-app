import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { ensureDemoWorkspace } from "@/lib/seed";

export async function GET() {
  const user = await ensureDemoWorkspace();
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const csvContent = [
    ["Name", "Email", "Phone", "Source", "Status", "Priority", "Budget Min", "Budget Max", "Location", "Notes"].join(","),
    ...leads.map((lead) =>
      [
        `"${lead.firstName} ${lead.lastName}"`,
        lead.email ?? "",
        lead.phone ?? "",
        lead.source,
        lead.status,
        lead.priority,
        lead.budgetMin ?? "",
        lead.budgetMax ?? "",
        `"${lead.location ?? ""}"`,
        `"${(lead.notes ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    ),
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="crm-contacts.csv"',
    },
  });
}
