import { createAuthHandler } from "@/lib/auth";

const handler = createAuthHandler();

export { handler as GET, handler as POST };
