import { requirePlatformAdminPage } from "@/lib/security/guards";
import { PlatformShell } from "@/components/platform/platform-shell";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdminPage();

  return <PlatformShell>{children}</PlatformShell>;
}
