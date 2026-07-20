import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { requireTierResponse } from "@/lib/entitlements";

const SLUG_PATTERN = /^[a-z0-9-]{3,40}$/;
const MAX_BIO = 2000;
const MAX_URL = 2048;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "business-card");
  if (denied) return denied;

  return NextResponse.json({
    ok: true,
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileSlug: user.profileSlug,
      profileBio: user.profileBio,
      profileHeadshotUrl: user.profileHeadshotUrl,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const denied = requireTierResponse(user.planTier, "business-card");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  const data: Prisma.UserUpdateInput = {};

  if ("profileBio" in input) {
    const bio = input.profileBio;
    if (bio === null || bio === "") {
      data.profileBio = null;
    } else if (typeof bio === "string") {
      if (bio.length > MAX_BIO) {
        return NextResponse.json(
          { ok: false, error: `Bio must be ${MAX_BIO} characters or fewer.` },
          { status: 400 },
        );
      }
      data.profileBio = bio;
    } else {
      return NextResponse.json({ ok: false, error: "Bio must be a string." }, { status: 400 });
    }
  }

  if ("profileHeadshotUrl" in input) {
    const url = input.profileHeadshotUrl;
    if (url === null || url === "") {
      data.profileHeadshotUrl = null;
    } else if (typeof url === "string") {
      if (url.length > MAX_URL || !/^https?:\/\//i.test(url)) {
        return NextResponse.json(
          { ok: false, error: "Headshot must be a valid http(s) URL." },
          { status: 400 },
        );
      }
      data.profileHeadshotUrl = url;
    } else {
      return NextResponse.json({ ok: false, error: "Headshot URL must be a string." }, { status: 400 });
    }
  }

  if ("profileSlug" in input) {
    const slug = input.profileSlug;
    if (slug === null || slug === "") {
      data.profileSlug = null;
    } else if (typeof slug === "string") {
      if (!SLUG_PATTERN.test(slug)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Link must be 3-40 characters: lowercase letters, numbers, and hyphens only.",
          },
          { status: 400 },
        );
      }
      data.profileSlug = slug;
    } else {
      return NextResponse.json({ ok: false, error: "Link must be a string." }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        name: true,
        email: true,
        phone: true,
        profileSlug: true,
        profileBio: true,
        profileHeadshotUrl: true,
      },
    });
    return NextResponse.json({ ok: true, profile: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "That link is already taken. Please choose another." },
        { status: 409 },
      );
    }
    throw err;
  }
}
