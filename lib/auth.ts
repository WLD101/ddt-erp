// lib/auth.ts
//
// NextAuth v5 configuration.
// Key multi-tenancy change: the JWT callback resolves and caches the user's
// primary organizationId at login time, embedding it in the token.
// This means `getCurrentTenantContext()` can read the org from the JWT
// (fast path) without a DB round-trip on every request.

// Dynamic subdomain authentication for Multi-Tenant NextAuth v5
if (process.env.NEXTAUTH_URL) {
  delete process.env.NEXTAUTH_URL;
}
if (process.env.AUTH_URL) {
  delete process.env.AUTH_URL;
}

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { getAuthSecret, isProductionEnv } from "@/lib/security/env";
import {
  consumeVerifiedSignInChallenge,
  getSessionSecurityState,
} from "@/modules/security/service";

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
        challengeToken: { label: "Challenge Token", type: "text" },
      },
      async authorize(credentials) {
        if (typeof credentials?.challengeToken === "string" && credentials.challengeToken.length > 0) {
          const challengedUser = await consumeVerifiedSignInChallenge(credentials.challengeToken);
          if (!challengedUser) {
            devLog("Invalid or expired 2FA challenge token during authorize.");
            return null;
          }
          return challengedUser;
        }

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

        let membership: { organizationId: string; role: { name: string } } | null = null;

        if (!token.isSuperAdmin) {
          membership = await prisma.organizationUser.findFirst({
            where: { userId: token.sub },
            select: { organizationId: true, role: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          });
        }

        if (membership?.organizationId) {
          token.organizationId = membership.organizationId;
          token.role = membership.role.name;
        }

        const securityState =
          token.isSuperAdmin || !token.sub
            ? null
            : await getSessionSecurityState({
                userId: token.sub,
                organizationId: membership?.organizationId ?? (typeof token.organizationId === "string" ? token.organizationId : null),
              });

        if (securityState) {
          if (
            typeof token.securitySessionVersion === "number" &&
            token.securitySessionVersion !== securityState.sessionVersion
          ) {
            token.forceSignOut = true;
          }

          if (
            typeof token.securityPolicyUpdatedAt === "number" &&
            securityState.policyUpdatedAt &&
            token.securityPolicyUpdatedAt !== securityState.policyUpdatedAt
          ) {
            token.forceSignOut = true;
          }

          if (
            securityState.policy?.absoluteSessionLifetimeMinutes &&
            typeof token.iat === "number" &&
            Date.now() >= token.iat * 1000 + securityState.policy.absoluteSessionLifetimeMinutes * 60 * 1000
          ) {
            token.forceSignOut = true;
          }

          if (securityState.emergencyLockEnabled) {
            token.forceSignOut = true;
          }

          const role = membership?.role.name ?? (typeof token.role === "string" ? token.role : "");
          const policyRequiresEnrollment =
            !!securityState.policy?.requireTwoFactorForAllUsers ||
            (["owner", "admin", "super_admin"].includes(role) &&
              !!securityState.policy?.requireTwoFactorForPrivileged);

          token.securitySessionVersion = securityState.sessionVersion;
          token.securityPolicyUpdatedAt = securityState.policyUpdatedAt;
          token.twoFactorEnabled = securityState.profile.totpEnabled;
          token.mfaEnrollmentRequired = !securityState.profile.totpEnabled && policyRequiresEnrollment;
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
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        session.user.forceSignOut = token.forceSignOut === true;
        session.user.mfaEnrollmentRequired = token.mfaEnrollmentRequired === true;
        session.user.twoFactorEnabled = token.twoFactorEnabled === true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
