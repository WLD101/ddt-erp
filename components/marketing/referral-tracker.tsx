"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * ReferralTracker - Captures the 'ref' query parameter and persists it
 * in localStorage for attribution during signup.
 */
export function ReferralTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      // Store the referral code permanently in localStorage
      // This will be picked up by the signup form later.
      localStorage.setItem("nexus_ref_code", refCode);
      
      // Also store timestamp for future attribution window logic if needed
      localStorage.setItem("nexus_ref_timestamp", new Date().toISOString());
      
      console.log(`[ReferralTracker] captured: ${refCode}`);
    }
  }, [refCode]);

  return null; // Invisible component
}
