import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === "admin@realtor.com" &&
          credentials?.password === "admin123"
        ) {
          return {
            id: "local-admin",
            name: "Admin",
            email: "admin@realtor.com",
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { id: string }).id = String(
          token.id ?? "local-admin",
        );
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export function createAuthHandler() {
  return NextAuth(authOptions);
}
