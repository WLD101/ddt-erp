import { ShieldCheck } from "lucide-react";

import { PasswordRecoveryPanel } from "@/components/auth/password-recovery-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPasswordRecoveryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="wq-eyebrow text-primary">Workspace Security</p>
        <h2 className="wq-page-title">Password recovery</h2>
        <p className="wq-page-copy max-w-3xl">
          Send a secure reset link without leaving your workspace settings. This is useful when an owner or staff member
          needs to recover access safely.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PasswordRecoveryPanel embedded />

        <Card className="border-outline-variant/30 bg-surface shadow-soft">
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-black tracking-tight text-on-surface">Recovery guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-on-surface-variant">
            <p>
              Reset links are sent only to the account email and can be used from the secure sign-in experience.
            </p>
            <p>
              If your teammate no longer has mailbox access, update their email first from the users screen, then issue
              recovery again.
            </p>
            <p>
              For higher-risk roles, combine password recovery with your security and audit checks before granting access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
