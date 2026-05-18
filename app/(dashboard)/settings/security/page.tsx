import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
                Start password recovery directly from settings if someone on your workspace loses access.
              </p>
              <Button asChild className="mt-4">
                <Link href="/settings/security/password-recovery">
                  Open password recovery
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-outline-variant/30 bg-surface shadow-soft">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-black tracking-tight text-on-surface">Password recovery is now wired inside settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-on-surface-variant">
          <p>
            Your workspace no longer depends on a dead or hidden link. Recovery now has a dedicated page under
            security so the flow feels native for tenant owners and admins.
          </p>
          <p>
            It still uses the same secure email-reset action behind the scenes, so production auth behavior stays stable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
