// components/billing/PlanUsageWidget.tsx

import { getSubscriptionContext } from "@/lib/billing/enforcement";
import { getCurrentTenantContext } from "@/lib/tenant";
import { Progress } from "@/components/ui/progress";
import { Zap, Users, Package, FileText, UsersRound } from "lucide-react";
import Link from "next/link";
import { formatPlanLimit } from "@/lib/billing/plans";

export async function PlanUsageWidget() {
  const ctx = await getCurrentTenantContext();
  const { plan, usage } = await getSubscriptionContext(ctx.organizationId);

  const stats = [
    {
      label: "Users",
      current: usage.users,
      limit: plan.limits.maxUsers,
      icon: <Users className="w-3 h-3" />,
    },
    {
      label: "Products",
      current: usage.products,
      limit: plan.limits.maxProducts,
      icon: <Package className="w-3 h-3" />,
    },
    {
      label: "Customers",
      current: usage.customers,
      limit: plan.limits.maxCustomers,
      icon: <UsersRound className="w-3 h-3" />,
    },
    {
      label: "Monthly Sales",
      current: usage.monthlyInvoices,
      limit: plan.limits.maxMonthlyInvoices,
      icon: <FileText className="w-3 h-3" />,
    },
  ];

  return (
    <div className="mx-4 my-4 p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
          <Zap className="w-3 h-3 mr-1.5 text-primary fill-primary/20" />
          Plan: {plan.name}
        </h4>
        {plan.id === "starter" && (
          <Link 
            href="/settings/billing" 
            className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {stats.map((stat) => {
          const percentage = Math.min((stat.current / stat.limit) * 100, 100);
          const isNearLimit = percentage > 80;

          return (
            <div key={stat.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <div className="flex items-center text-slate-400">
                  {stat.icon}
                  <span className="ml-1.5">{stat.label}</span>
                </div>
                <span className={isNearLimit ? "text-rose-400" : "text-slate-300"}>
                  {stat.current} / {formatPlanLimit(stat.limit)}
                </span>
              </div>
              <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                    isNearLimit ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {plan.price.promoEnabled && plan.price.promoLabel ? (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] leading-relaxed text-emerald-300">
            {plan.price.promoLabel}
          </p>
        </div>
      ) : null}

      {plan.id === "starter" && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] leading-relaxed text-slate-500 italic">
            Upgrade to Business for more users, more branches, CSV import, and ecommerce-ready workflows.
          </p>
        </div>
      )}
    </div>
  );
}
