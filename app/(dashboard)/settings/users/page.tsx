import { prisma } from "@/lib/prisma";
import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldAlert, Key } from "lucide-react";
import { getSubscriptionContext } from "@/lib/billing/enforcement";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
            User <span className="text-primary">Management</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your team seats, external invitations, and role-based access levels.
          </p>
        </div>
        <div>
          <Button disabled={isLimitReached} className="font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
          {isLimitReached && (
            <p className="text-[10px] text-rose-400 mt-2 text-right uppercase font-bold tracking-widest">
              Plan Seat Limit Reached
            </p>
          )}
        </div>
      </div>

      <Card className="border-white/5 bg-black/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-black text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Active Seats
          </CardTitle>
          <CardDescription>
            You are using <strong className="text-white">{memberships.length}</strong> of {subCtx.plan.limits.maxUsers} allowed member seats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-white/5">
            {memberships.map((membership) => {
              const isSelf = membership.userId === ctx.userId;
              const isOwner = membership.role.name === "owner";
              
              return (
                <div key={membership.id} className="py-4 flex items-center justify-between hover:bg-white/[0.02] px-4 -mx-4 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-indigo-600/40 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-white/80">
                        {membership.user.name?.charAt(0).toUpperCase() || membership.user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {membership.user.name || "Pending User"}
                        {isSelf && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] uppercase tracking-widest">You</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{membership.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isOwner ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-muted-foreground'}`}>
                        {membership.role.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-white/10" disabled={isSelf || isOwner}>
                        Edit Role
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-white/10 text-rose-400 hover:text-rose-400 hover:bg-rose-500/10" disabled={isSelf || isOwner}>
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
      
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-xs text-amber-200/80 mt-6">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <p>
          <strong className="text-amber-400">Notice:</strong> Organization Owners cannot have their access revoked. To transfer ownership, contact support. Adding or modifying members immediately updates system limits.
        </p>
      </div>

    </div>
  );
}
