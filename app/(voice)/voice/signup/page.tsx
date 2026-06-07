import { redirect } from "next/navigation";

export default function VoiceSignupRedirect() {
  redirect("/voice/auth/signup");
}
