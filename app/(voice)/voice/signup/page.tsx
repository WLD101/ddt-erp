import { redirect } from "next/navigation";

export default function VoiceSignupRedirect({ searchParams }: { searchParams: any }) {
  const callbackUrl = searchParams?.callbackUrl || "/onboarding";
  redirect(`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
