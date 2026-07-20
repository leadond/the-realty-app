import { prisma } from "@/lib/db";
import { verifyCalendarToken } from "@/lib/calendar-token";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ userId: string }> };

const CRLF = "\r\n";
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

/** Formats a Date as an ICS UTC timestamp: YYYYMMDDTHHMMSSZ. */
function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes text per RFC 5545 (commas, semicolons, backslashes, newlines). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
};

function buildEvent(event: IcsEvent, stamp: string): string {
  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    "END:VEVENT",
  ].join(CRLF);
}

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!verifyCalendarToken(userId, token)) {
    return new Response("Forbidden", { status: 403 });
  }

  const now = new Date();

  const [showings, openHouses, transactions] = await Promise.all([
    prisma.showing.findMany({
      where: { userId, scheduledAt: { gte: now } },
      include: { property: { select: { address: true, city: true, state: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.openHouse.findMany({
      where: { userId, startDate: { gte: now } },
      include: { property: { select: { address: true, city: true, state: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId, closingDate: { gte: now } },
      orderBy: { closingDate: "asc" },
    }),
  ]);

  const events: IcsEvent[] = [];

  for (const showing of showings) {
    const location = showing.property
      ? `${showing.property.address}, ${showing.property.city}, ${showing.property.state}`
      : "property";
    events.push({
      uid: `showing-${showing.id}@realtor-ai-assistant`,
      start: showing.scheduledAt,
      end: new Date(showing.scheduledAt.getTime() + showing.durationMin * 60 * 1000),
      summary: `Showing: ${location}`,
      description: showing.notes ?? `Showing at ${location}`,
    });
  }

  for (const openHouse of openHouses) {
    const location = openHouse.property
      ? `${openHouse.property.address}, ${openHouse.property.city}, ${openHouse.property.state}`
      : "property";
    events.push({
      uid: `openhouse-${openHouse.id}@realtor-ai-assistant`,
      start: openHouse.startDate,
      end: openHouse.endDate,
      summary: `Open House: ${location}`,
      description: openHouse.description ?? `Open house at ${location}`,
    });
  }

  for (const transaction of transactions) {
    if (!transaction.closingDate) continue;
    events.push({
      uid: `transaction-${transaction.id}@realtor-ai-assistant`,
      start: transaction.closingDate,
      end: new Date(transaction.closingDate.getTime() + DEFAULT_DURATION_MS),
      summary: `Closing: ${transaction.type}`,
      description: transaction.agentNotes ?? `Transaction closing (${transaction.status})`,
    });
  }

  const stamp = toIcsDate(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Realtor AI Assistant//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.map((event) => buildEvent(event, stamp)),
    "END:VCALENDAR",
  ];

  return new Response(lines.join(CRLF) + CRLF, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="realtor-calendar.ics"',
    },
  });
}
