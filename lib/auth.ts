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
import { isPlatformAdminEmail } from "@/lib/security/access";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { getAuthSecret, isProductionEnv } from "@/lib/security/env";

const authSecret = getAuthSecret();
const isProduction = isProductionEnv();
const devLog = (...args: unknown[]) => {
  if (!isProduction) {
    console.log(...args);
  }
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: authSecret,
  useSecureCookies: isProduction,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          devLog("Missing email or password during authorize.");
          return null;
        }
        
        const email = (credentials.email as string).toLowerCase();
        const limit = await checkRateLimit(rateLimitKey("login", email), {
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        if (!limit.allowed) {
          devLog("Login rate limit exceeded for email:", email);
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { email },
        });

        if (!user) {
          devLog("No user found in DB for email:", email);
          return null;
        }

        if (!user.password) {
          devLog("User has no password set in DB");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          devLog("Invalid password for email:", email);
          return null;
        }

        devLog("User authorized successfully:", user.id);
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
      }
      if (token.sub) {
        const email = token.email as string | undefined;
        token.isSuperAdmin = isPlatformAdminEmail(email);

        if (!token.organizationId) {
          const membership = token.isSuperAdmin
            ? null
            : await prisma.organizationUser.findFirst({
                where: { userId: token.sub },
                select: { organizationId: true },
                orderBy: { createdAt: "asc" },
              });

          if (membership) {
            token.organizationId = membership.organizationId;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.organizationId && session.user) {
        session.user.organizationId = token.organizationId;
      }
      if (session.user) {
        session.user.isSuperAdmin = token.isSuperAdmin === true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
