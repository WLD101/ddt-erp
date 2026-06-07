import { redirect } from "next/navigation";

export default function VoiceLoginRedirect({ searchParams }: { searchParams: any }) {
  // Pass along callbackUrl if it exists
  const callbackUrl = searchParams?.callbackUrl || "/onboarding";
  redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
