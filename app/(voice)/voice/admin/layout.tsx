import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";

export default async function VoiceAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const host = await getVoiceRequestHost();

  if (!session?.user?.id) {
    const loginHref = toVoiceExternalPath("/login", host);
    const adminHref = toVoiceExternalPath("/admin/command-center", host);
    redirect(`${loginHref}?callbackUrl=${encodeURIComponent(adminHref)}`);
  }

  if (!isPlatformAdminEmail(session.user.email)) {
    redirect(toVoiceExternalPath("/dashboard", host));
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Voice Admin Navigation could go here, or we let the page handle it */}
      {children}
    </div>
  );
}
