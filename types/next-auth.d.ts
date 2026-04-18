// types/next-auth.d.ts
// Augments NextAuth's built-in types to include ERP-specific fields
// surfaced on the JWT token and the client-visible session object.

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      /** The NextAuth user ID (maps to User.id in Prisma) */
      id: string;
      /** The resolved primary organization for this session */
      organizationId?: string;
      // Standard fields
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  // Extend the User object returned from `authorize()` so we can pass
  // extra fields into the JWT callback below.
  interface User {
    id: string;
    organizationId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    /** Cached primary organizationId — set once at login, stored in the JWT */
    organizationId?: string;
  }
}
