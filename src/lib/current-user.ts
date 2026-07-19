import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Resolves the authenticated user for the current request, including their
 * organization (if any). Returns null if there is no valid session.
 * Route middleware guarantees a session exists for protected paths, but
 * callers should still handle null defensively.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
