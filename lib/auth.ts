// lib/auth.ts
//
// NextAuth v5 configuration.
// Key multi-tenancy change: the JWT callback resolves and caches the user's
// primary organizationId at login time, embedding it in the token.
// This means `getCurrentTenantContext()` can read the org from the JWT
// (fast path) without a DB round-trip on every request.

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const DEBUG_LOG = path.join(process.cwd(), "auth-debug.log");

function logAuth(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(DEBUG_LOG, `[${timestamp}] ${message}\n`);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = (credentials.email as string).toLowerCase();
        logAuth(`Login attempt for: ${email}`);
        logAuth(`Using DB URL: ${process.env.DATABASE_URL}`);

        const user = await prisma.user.findFirst({
          where: { email },
        });

        if (!user) {
          logAuth(`User not found: ${email}`);
          return null;
        }

        if (!user.password) {
          logAuth(`User has no password: ${email}`);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          logAuth(`Invalid password for: ${email}`);
          return null;
        }

        logAuth(`Success for: ${email}`);
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * JWT callback — runs once at sign-in and then on every session access.
     * We embed organizationId into the token here so downstream calls can
     * use the fast path in getCurrentTenantContext().
     */
    async jwt({ token, user }) {
      // `user` is only populated on the initial sign-in event
      if (user?.id) {
        token.sub = user.id;

        // Resolve the user's primary org membership at login time
        // and cache it in the JWT to avoid per-request DB lookups.
        const membership = await prisma.organizationUser.findFirst({
          where: { userId: user.id },
          select: { organizationId: true },
          orderBy: { createdAt: "asc" }, // earliest = primary org
        });

        if (membership) {
          token.organizationId = membership.organizationId;
        }
      }
      return token;
    },

    /**
     * Session callback — maps JWT data onto the session object exposed
     * to client components and server actions via `auth()`.
     */
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.organizationId && session.user) {
        session.user.organizationId = token.organizationId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
