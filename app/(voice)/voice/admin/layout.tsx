import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isPlatformAdminEmail } from "@/lib/security/access";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { AdminSidebar } from "./_components/admin-sidebar";

export const dynamic = "force-dynamic";

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
    <div className="flex h-screen overflow-hidden bg-surface">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
