import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="wq-eyebrow text-primary">Workspace Security</p>
        <h2 className="wq-page-title">Security Center</h2>
        <p className="wq-page-copy max-w-3xl">
          Review tenant-safe security guidance, access governance, and audit visibility for your workspace.
        </p>
      </div>

      <Card className="border-outline-variant/30 bg-surface shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl font-black tracking-tight text-on-surface">
            Security settings are being staged carefully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-on-surface-variant">
          <p>
            This route is now active so your team no longer hits a dead link. The full tenant security controls
            are being rolled out in safe slices so production auth and billing flows stay stable.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4">
              <p className="wq-eyebrow text-on-surface-variant">Access Governance</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">
                Review workspace roles and permissions before granting sensitive access.
              </p>
              <Link href="/settings/roles" className="mt-4 inline-flex text-sm font-bold text-primary hover:opacity-80">
                Open roles & permissions
              </Link>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4">
              <p className="wq-eyebrow text-on-surface-variant">Audit Visibility</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">
                Monitor workspace activity, export events, and compliance-sensitive changes.
              </p>
              <Link href="/settings/audit-logs" className="mt-4 inline-flex text-sm font-bold text-primary hover:opacity-80">
                Open audit logs
              </Link>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-4">
              <p className="wq-eyebrow text-on-surface-variant">Authentication</p>
              <p className="mt-2 text-sm font-semibold text-on-surface">
                Use password recovery from sign-in if you lose access while advanced controls are finishing rollout.
              </p>
              <Link href="/auth/forgot-password" className="mt-4 inline-flex text-sm font-bold text-primary hover:opacity-80">
                Open password recovery
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
