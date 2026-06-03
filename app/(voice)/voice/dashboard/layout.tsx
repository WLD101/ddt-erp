import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getVoiceRequestHost, toVoiceExternalPath } from "@/lib/voice/routing";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceSidebar } from "@/components/voice/voice-sidebar";
import { Navbar } from "@/components/navbar";

export default async function VoiceDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const host = await getVoiceRequestHost();

  if (!session?.user?.id) {
    const loginHref = toVoiceExternalPath("/login", host);
    const dashboardHref = toVoiceExternalPath("/dashboard", host);
    redirect(`${loginHref}?callbackUrl=${encodeURIComponent(dashboardHref)}`);
  }

  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");

  return (
    <div className="flex min-h-screen w-full bg-surface-container-lowest overflow-hidden">
      <VoiceSidebar />
      <div className="flex flex-col flex-1 min-w-0 md:pl-[260px]">
        <Navbar />
        <main className="flex-1 overflow-auto bg-surface-container-low/20">
          <div className="mx-auto max-w-6xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
