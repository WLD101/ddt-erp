import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { cn } from "@/lib/utils";

export default async function SettingsUsersPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const subCtx = await getSubscriptionContext(ctx.organizationId);

  const memberships = await prisma.organizationUser.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      role: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const isLimitReached = memberships.length >= subCtx.plan.limits.maxUsers;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Team <span className="text-primary">Topology</span>
          </h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1 font-body-md">
            Manage organization seats, invitations, and role-based clearance levels.
          </p>
        </div>
        <div>
          <Button disabled={isLimitReached} className="h-11 px-8 rounded-2xl shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px] mr-2">person_add</span>
            Deploy Member
          </Button>
          {isLimitReached && (
            <p className="text-[10px] text-error mt-2 text-right font-black uppercase tracking-widest">
              Protocol: Seat Limit Reached
            </p>
          )}
        </div>
      </div>

      <Card className="rounded-3xl shadow-soft">
        <CardHeader className="border-b border-outline-variant/10 pb-6 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <div>
               <CardTitle className="text-lg font-black text-on-surface tracking-tight font-headline-sm flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary text-[24px]">key</span> 
                 Active Clearance Manifest
               </CardTitle>
               <CardDescription className="text-xs font-medium text-on-surface-variant uppercase tracking-widest mt-1">
                 Utilization: <span className="text-on-surface font-black">{memberships.length}</span> / {subCtx.plan.limits.maxUsers} Node Seats
               </CardDescription>
            </div>
            <div className="hidden md:block">
               <div className="h-2 w-48 bg-surface-container-low rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary" 
                   style={{ width: `${(memberships.length / subCtx.plan.limits.maxUsers) * 100}%` }}
                 />
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-outline-variant/10">
            {memberships.map((membership) => {
              const isSelf = membership.userId === ctx.userId;
              const isOwner = membership.role.name === "owner";
              
              return (
                <div key={membership.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-surface-container-low/20 transition-colors gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-primary">
                        {membership.user.name?.charAt(0).toUpperCase() || membership.user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-on-surface tracking-tight">{membership.user.name || "Station Inactive"}</p>
                        {isSelf && <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[9px] font-black uppercase tracking-widest">Self</span>}
                      </div>
                      <p className="text-[11px] font-medium text-on-surface-variant/60">{membership.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        isOwner ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-surface-container text-on-surface-variant border-outline-variant/30"
                      )}>
                        {membership.role.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest" disabled={isSelf || isOwner}>
                        Modify Clearance
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-error hover:text-error hover:bg-error/5 border-outline-variant/30" disabled={isSelf || isOwner}>
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex gap-4 text-xs font-medium text-on-surface-variant">
        <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0">policy</span>
        <p>
          <strong className="text-amber-600 font-black uppercase tracking-widest">Security Protocol:</strong> Organization owners cannot have clearance revoked via standard terminals. Ownership transfer requires direct authorization. Deployment of new members immediately updates organizational billing metrics.
        </p>
      </div>

    </div>
  );
}
