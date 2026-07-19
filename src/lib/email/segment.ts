import { LeadPriority, LeadSource, LeadStatus, type Prisma } from "@prisma/client";

export type SegmentFilter = {
  status?: string;
  priority?: string;
  source?: string;
};

function asEnumValue<T extends Record<string, string>>(source: T, value: string | undefined) {
  if (!value) return undefined;
  return Object.values(source).includes(value) ? (value as T[keyof T]) : undefined;
}

/** Resolves a simple JSON segment filter (status/priority/source) into a Prisma where clause, scoped to one agent's leads. */
export function resolveSegment(userId: string, segmentJson: string): Prisma.LeadWhereInput {
  let filter: SegmentFilter = {};
  try {
    filter = JSON.parse(segmentJson || "{}");
  } catch {
    filter = {};
  }

  const status = asEnumValue(LeadStatus, filter.status);
  const priority = asEnumValue(LeadPriority, filter.priority);
  const source = asEnumValue(LeadSource, filter.source);

  return {
    userId,
    email: { not: null },
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(source ? { source } : {}),
  };
}
