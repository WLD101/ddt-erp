import { redirect } from "next/navigation";

export default function VoiceLoginRedirect({ searchParams }: { searchParams: any }) {
  // Pass along callbackUrl if it exists; default to Voice dashboard
  const callbackUrl = searchParams?.callbackUrl || "/voice/dashboard";
  redirect(`/voice/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
