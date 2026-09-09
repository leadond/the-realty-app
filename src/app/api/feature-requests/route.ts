import { NextResponse } from "next/server";
import type { FeatureRequestPriority, FeatureRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getRoadmapFeature, REQUEST_ACCESS_FEATURES } from "@/lib/feature-roadmap";

export const dynamic = "force-dynamic";

const REQUEST_STATUSES = ["PENDING", "REVIEWED", "PLANNED", "SHIPPED"] as const;
const REQUEST_PRIORITIES = ["INTERESTED", "IMPORTANT", "URGENT"] as const;

function parseStatus(value: unknown): FeatureRequestStatus | null {
  return REQUEST_STATUSES.includes(value as FeatureRequestStatus) ? (value as FeatureRequestStatus) : null;
}

function parsePriority(value: unknown): FeatureRequestPriority {
  return REQUEST_PRIORITIES.includes(value as FeatureRequestPriority)
    ? (value as FeatureRequestPriority)
    : "INTERESTED";
}

function parseNotes(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 1000) : null;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "BROKER") {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const requests = await prisma.featureAccessRequest.findMany({
    where: user.role === "ADMIN" ? undefined : { organizationId: user.organizationId || "" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totals = REQUEST_ACCESS_FEATURES.map((feature) => {
    const matching = requests.filter((request) => request.featureKey === feature.key);
    return {
      featureKey: feature.key,
      featureLabel: feature.label,
      group: feature.group,
      requestCount: matching.length,
      urgentCount: matching.filter((request) => request.priority === "URGENT").length,
      importantCount: matching.filter((request) => request.priority === "IMPORTANT").length,
      latestRequestAt: matching[0]?.updatedAt ?? null,
    };
  }).sort(
    (a, b) =>
      b.urgentCount - a.urgentCount ||
      b.importantCount - a.importantCount ||
      b.requestCount - a.requestCount ||
      a.featureLabel.localeCompare(b.featureLabel),
  );

  return NextResponse.json({ ok: true, totals, requests });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "A JSON object is required" }, { status: 400 });
  }
  if (body.priority !== undefined && !REQUEST_PRIORITIES.includes(body.priority)) {
    return NextResponse.json({ ok: false, error: "Invalid priority" }, { status: 400 });
  }
  const feature = getRoadmapFeature(String(body.featureKey || ""));
  if (!feature) {
    return NextResponse.json({ ok: false, error: "Unknown feature request" }, { status: 400 });
  }

  const notes = parseNotes(body.notes);
  const priority = parsePriority(body.priority);
  const featureRequest = await prisma.featureAccessRequest.upsert({
    where: { userId_featureKey: { userId: user.id, featureKey: feature.key } },
    update: {
      featureLabel: feature.label,
      requesterRole: user.role,
      organizationId: user.organizationId,
      ...(body.priority !== undefined ? { priority } : {}),
      ...(body.notes !== undefined ? { notes } : {}),
    },
    create: {
      userId: user.id,
      organizationId: user.organizationId,
      featureKey: feature.key,
      featureLabel: feature.label,
      requesterRole: user.role,
      priority,
      notes,
    },
  });

  return NextResponse.json({ ok: true, request: featureRequest }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "BROKER") {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "A JSON object is required" }, { status: 400 });
  }
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const status = parseStatus(body.status);
  if (!requestId || !status) {
    return NextResponse.json({ ok: false, error: "Request id and valid status are required" }, { status: 400 });
  }

  const existing = await prisma.featureAccessRequest.findUnique({
    where: { id: requestId },
    select: { organizationId: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Feature request not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && (!user.organizationId || existing.organizationId !== user.organizationId)) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const featureRequest = await prisma.featureAccessRequest.update({
    where: { id: requestId },
    data: {
      status,
      ...(Object.prototype.hasOwnProperty.call(body, "notes") ? { notes: parseNotes(body.notes) } : {}),
    },
  });

  return NextResponse.json({ ok: true, request: featureRequest });
}
