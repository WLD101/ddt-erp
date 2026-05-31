import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminPage } from "@/lib/security/guards";

const shellCardClassName =
  "overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.08)]";

export default async function CommandCenterSecurityPage() {
  await requirePlatformAdminPage();

  const [events, policies] = await Promise.all([
    prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        organization: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.organizationSecurityPolicy.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        organization: { select: { name: true, slug: true } },
      },
      take: 50,
    }),
  ]);

  const failedLogins = events.filter((event) => event.type === "auth.login.failed").length;
  const challengeEvents = events.filter((event) => event.type === "auth.login.challenge_issued").length;
  const lockedTenants = policies.filter((policy) => policy.emergencyLockEnabled).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.08),transparent_28%),linear-gradient(180deg,#f8f9ff_0%,#eef4ff_100%)] pb-12 text-on-surface">
      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-8">
        <section className="overflow-hidden rounded-[32px] border border-outline-variant/30 bg-linear-to-br from-surface via-surface to-surface-container-low shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-8 px-8 py-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <Badge className="border-none bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20">
                Security Console
              </Badge>
              <div className="space-y-3">
                <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
                  <span className="material-symbols-outlined text-[34px] text-primary sm:text-[40px]">shield_lock</span>
                  Tenant security posture
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-on-surface-variant sm:text-base">
                  Monitor failed sign-ins, MFA rollout, and tenant-wide session controls from one platform security surface.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <MetricBlock label="Failed logins" value={failedLogins} tone="error" />
              <MetricBlock label="2FA challenges" value={challengeEvents} tone="primary" />
              <MetricBlock label="Locked tenants" value={lockedTenants} tone="warning" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface">
                Recent security events
              </CardTitle>
              <CardDescription className="text-sm font-medium text-on-surface-variant">
                Latest authentication and workspace security activity across all tenants.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 pt-6">
              {events.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No security events logged yet.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface">{event.type}</p>
                        <p className="mt-1 text-sm font-medium text-on-surface-variant">{event.details || "Security event recorded."}</p>
                        <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
                          {event.organization?.name || "Platform"} • {event.user?.email || "system"} • {event.ipAddress || "IP unavailable"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            event.status === "critical"
                              ? "border-rose-500/30 text-rose-500"
                              : event.status === "warning"
                                ? "border-amber-500/30 text-amber-600"
                                : "border-outline-variant/30 text-on-surface-variant"
                          }
                        >
                          {event.status}
                        </Badge>
                        <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={shellCardClassName}>
            <CardHeader className="border-b border-outline-variant/10 bg-surface px-6 pb-5 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-on-surface">
                Tenant policy minimums
              </CardTitle>
              <CardDescription className="text-sm font-medium text-on-surface-variant">
                Review who is enforcing MFA and how aggressive each tenant&apos;s session policy is.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 pt-6">
              {policies.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No tenant security policies have been configured yet.</p>
              ) : (
                policies.map((policy) => (
                  <div key={policy.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-on-surface">{policy.organization.name}</p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-on-surface-variant">
                          /{policy.organization.slug}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {policy.requireTwoFactorForAllUsers ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700">2FA all users</Badge>
                          ) : null}
                          {policy.requireTwoFactorForPrivileged ? (
                            <Badge className="bg-primary/10 text-primary">2FA privileged</Badge>
                          ) : null}
                          {policy.emergencyLockEnabled ? (
                            <Badge className="bg-rose-500/10 text-rose-600">Emergency lock</Badge>
                          ) : null}
                          {policy.restrictConcurrentSessions ? (
                            <Badge className="bg-amber-500/10 text-amber-700">Device cap</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-medium text-on-surface-variant">
                        <p>Idle timeout: {policy.idleTimeoutMinutes} min</p>
                        <p>Absolute lifetime: {policy.absoluteSessionLifetimeMinutes ?? "none"}</p>
                        <p>Updated: {new Date(policy.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "warning" | "error";
}) {
  const toneClassName =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="rounded-3xl border border-outline-variant/30 bg-surface/80 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <p className={`mt-3 text-3xl font-black tracking-tight ${toneClassName}`}>{value}</p>
    </div>
  );
}
