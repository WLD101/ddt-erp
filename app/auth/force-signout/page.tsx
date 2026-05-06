"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function ForceSignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/auth/signin" });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-on-surface-variant text-sm">Signing out…</p>
    </div>
  );
}
