import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RevenueChannel = {
  channelId: string;
  channelName: string;
  channelType: string;
  revenue: number;
  orders: number;
  share: number;
};

type EcommerceIntelligenceData = {
  hasChannels: boolean;
  channelCount: number;
  totalEcommerceOrdersToday: number;
  revenueByChannel: RevenueChannel[];
  ecommerceRevenueTotal: number;
  topSellingChannel: {
    name: string;
    revenue: number;
    share: number;
    orders: number;
  } | null;
  lowStockAcrossChannels: {
    count: number;
    products: Array<{
      id: string;
      name: string;
      sku: string;
      quantity: number;
      threshold: number;
    }>;
  };
  unmappedProductsCount: number;
  ordersNotYetImported: number;
  stockMismatchCount: number;
  topSellingSku: {
    sku: string;
    name: string;
    quantity: number;
  } | null;
  insights: string[];
  channels: Array<{
    id: string;
    name: string;
    type: string;
    syncStatus: string;
    syncError: string | null;
    lastSyncAt: Date | null;
  }>;
};

function formatCurrency(value: number) {
  return `Rs. ${(value ?? 0).toLocaleString()}`;
}

function formatSyncTime(value: Date | null) {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EcommerceIntelligence({ data }: { data: EcommerceIntelligenceData }) {
  if (!data.hasChannels) {
    return (
      <Card className="rounded-3xl border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mb-4">
                Global Operations
              </span>
              <CardTitle className="text-xl font-black text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">smart_toy</span>
                Online Sales Intelligence
              </CardTitle>
              <p className="text-on-surface-variant text-sm font-medium mt-2 max-w-xl">
                Connect your online stores to start seeing intelligent business insights, automated order tracking, and stock synchronization across Daraz, Shopify, and more.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="h-10">
                <Link href="/settings/integrations">Configure Channels</Link>
              </Button>
              <Button asChild className="h-10">
                <Link href="/imports">Import Data</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-primary mb-4 shadow-soft border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl">storefront</span>
          </div>
          <h4 className="text-lg font-black text-on-surface mb-2">Omnichannel Engine Idle</h4>
          <p className="text-on-surface-variant text-xs font-medium max-w-sm mx-auto italic">
            Integrate your ecommerce storefronts to unlock the full potential of WhatsQuery's AI-driven inventory and sales reconciliation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-outline-variant/10 pb-6 bg-surface-container-lowest">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mb-3">
              Active Sync Engine
            </span>
            <CardTitle className="text-xl font-black text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">analytics</span>
              Global Channel Intelligence
            </CardTitle>
            <p className="text-on-surface-variant text-xs font-medium mt-1">
              Aggregated insights from {data.channelCount} active online sales nodes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link href="/settings/integrations" className="flex items-center gap-2">
                Manage Nodes
                <span className="material-symbols-outlined text-[18px]">settings</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="h-9">
              <Link href="/imports">Manual Sync</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <InsightStat title="Orders (24h)" value={data.totalEcommerceOrdersToday} icon="shopping_bag" />
          <InsightStat title="Dominant Node" value={data.topSellingChannel?.name ?? "N/A"} icon="stars" />
          <InsightStat title="Unmapped SKU" value={data.unmappedProductsCount} icon="link_off" color="text-amber-600" />
          <InsightStat title="Pending" value={data.ordersNotYetImported} icon="pending_actions" />
          <InsightStat title="Mismatch" value={data.stockMismatchCount} icon="sync_problem" color="text-error" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-low/20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-black text-on-surface uppercase tracking-wider">Revenue Distribution</h3>
                  <p className="text-[11px] font-medium text-on-surface-variant">Market share across active channels</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-primary">Rs. {(data.ecommerceRevenueTotal).toLocaleString()}</span>
                  <p className="text-[9px] text-on-surface-variant uppercase font-black tracking-widest mt-0.5">Weekly Vol</p>
                </div>
              </div>
              <div className="space-y-6">
                {data.revenueByChannel.map((channel) => (
                  <div key={channel.channelId} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-on-surface">{channel.channelName}</span>
                      <span className="text-primary">Rs. {channel.revenue.toLocaleString()}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-primary"
                        style={{ width: `${channel.share}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-black uppercase tracking-wider">
                      <span>{channel.orders} transactions</span>
                      <span>{Math.round(channel.share)}% Volume</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-low/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-on-surface uppercase tracking-wider">Global Inventory Risk</h3>
                <Badge variant={data.lowStockAcrossChannels.count > 0 ? "destructive" : "secondary"} className="rounded-lg font-black">
                  {data.lowStockAcrossChannels.count} CRITICAL
                </Badge>
              </div>
              <div className="space-y-3">
                {data.lowStockAcrossChannels.products.length > 0 ? (
                  data.lowStockAcrossChannels.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-outline-variant/20 shadow-sm">
                      <div>
                        <p className="text-xs font-black text-on-surface">{product.name}</p>
                        <p className="text-[10px] font-black text-on-surface-variant/60 tracking-widest uppercase mt-0.5">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-error font-black text-sm">{product.quantity}</span>
                        <p className="text-[10px] font-black text-on-surface-variant/60 uppercase">Units</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-on-surface-variant text-sm font-medium italic">All channel stock is healthy.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="p-6 rounded-3xl border border-primary/20 bg-primary/[0.03]">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-[24px]">lightbulb</span>
                <h3 className="text-sm font-black text-primary uppercase tracking-wider">AI Operations Insights</h3>
              </div>
              <div className="space-y-4">
                {data.insights.map((insight, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/80 rounded-2xl border border-primary/10 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-on-surface-variant text-xs font-medium leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-outline-variant/30 bg-surface-container-low/20">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-wider mb-6">Node Latency & Performance</h3>
              <div className="space-y-4">
                {data.channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-outline-variant/20 hover:border-primary/30 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${channel.syncStatus === 'SUCCESS' ? 'bg-secondary' : 'bg-error'} shadow-sm`} />
                      <div>
                        <p className="text-xs font-black text-on-surface">{channel.name}</p>
                        <p className="text-[10px] font-medium text-on-surface-variant">{formatSyncTime(channel.lastSyncAt)}</p>
                      </div>
                    </div>
                    <Badge variant={channel.syncStatus === 'SUCCESS' ? 'secondary' : 'destructive'} className="text-[9px] font-black px-2 py-0.5 rounded-lg">
                      {channel.syncStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightStat({ title, value, icon, color = "text-primary" }: { title: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/20 hover:bg-white transition-all group shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60 group-hover:text-primary transition-colors">{icon}</span>
        <span className="text-[9px] font-black text-on-surface-variant uppercase font-black tracking-widest">{title}</span>
      </div>
      <div className={cn("text-2xl font-black tracking-tight", color)}>{value}</div>
    </div>
  );
}
