"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  pushSalesChannelInventory,
  syncSalesChannelOrders,
  syncSalesChannelProducts,
  testSalesChannelConnection,
} from "@/modules/integrations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Channel = {
  id: string;
  name: string;
  type: "DARAZ" | "SHOPIFY" | "WOOCOMMERCE" | "CSV";
  isActive: boolean;
  syncStatus: string;
  syncError: string | null;
  lastSyncAt: Date | string | null;
  hasCredentials: boolean;
  connectionState: string;
  statusLabel: string;
  syncMessage: string;
  warnings: string[];
  counts: {
    productMaps: number;
    orderMaps: number;
    syncLogs: number;
    totalProducts: number;
    unmappedProducts: number;
  };
};

type ImportJob = {
  id: string;
  fileName: string;
  importType: string;
  status: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errorSummary: string | null;
  createdAt: Date | string;
};

type IntegrationCardConfig = {
  type: "DARAZ" | "SHOPIFY" | "WOOCOMMERCE" | "CSV";
  title: string;
  description: string;
  icon: string;
  gradient: string;
  connectHref: string;
  logsHref: string;
  connectLabel: string;
  testLabel: string;
  productsLabel: string;
  ordersLabel: string;
  inventoryLabel: string;
};

const CARD_CONFIGS: IntegrationCardConfig[] = [
  {
    type: "DARAZ",
    title: "Daraz Global",
    description: "Orchestrate your Daraz marketplace presence through a unified ERP interface.",
    icon: "shopping_cart",
    gradient: "from-emerald-500/10 to-transparent",
    connectHref: "/settings/integrations/daraz",
    logsHref: "/settings/integrations/daraz",
    connectLabel: "Authorize",
    testLabel: "Verify Connection",
    productsLabel: "Map Catalog",
    ordersLabel: "Ingest Orders",
    inventoryLabel: "Push Inventory",
  },
  {
    type: "SHOPIFY",
    title: "Shopify",
    description: "Keep storefront products, orders, and fulfillment protocols aligned in real-time.",
    icon: "storefront",
    gradient: "from-cyan-500/10 to-transparent",
    connectHref: "/settings/integrations/shopify",
    logsHref: "/settings/integrations/shopify",
    connectLabel: "Authorize",
    testLabel: "Verify Connection",
    productsLabel: "Map Catalog",
    ordersLabel: "Ingest Orders",
    inventoryLabel: "Push Inventory",
  },
  {
    type: "WOOCOMMERCE",
    title: "WooCommerce",
    description: "Sync your WordPress-powered commerce flow into the centralized organizational grid.",
    icon: "shopping_bag",
    gradient: "from-violet-500/10 to-transparent",
    connectHref: "/settings/integrations/woocommerce",
    logsHref: "/settings/integrations/woocommerce",
    connectLabel: "Authorize",
    testLabel: "Verify Connection",
    productsLabel: "Map Catalog",
    ordersLabel: "Ingest Orders",
    inventoryLabel: "Push Inventory",
  },
  {
    type: "CSV",
    title: "Legacy Manifests",
    description: "Upload spreadsheet data when physical nodes or marketplaces lack API authorization.",
    icon: "upload_file",
    gradient: "from-amber-500/10 to-transparent",
    connectHref: "/imports",
    logsHref: "/imports",
    connectLabel: "Import Center",
    testLabel: "Preview Schema",
    productsLabel: "Import SKU List",
    ordersLabel: "Import Order Log",
    inventoryLabel: "Sync Stock Sheet",
  },
];

function formatDate(value: Date | string | null) {
  if (!value) return "Inactive Node";

  const parsed = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function statusVariant(status: string) {
  if (status === "SUCCESS" || status === "COMPLETED") return "default";
  if (status === "FAILED") return "destructive";
  return "secondary";
}

function summarizeImportCard(importJobs: ImportJob[]) {
  if (importJobs.length === 0) {
    return {
      connected: false,
      statusLabel: "Standby",
      syncStatus: "NOT_CONFIGURED",
      syncError: null as string | null,
      lastSyncAt: null as Date | string | null,
      countText: "No manifests processed",
      syncMessage: "Upload a manifest to initialize",
    };
  }

  const latest = importJobs[0];
  const hasWarnings = latest.status === "PARTIAL" || (latest.failedRows ?? 0) > 0;
  return {
    connected: true,
    statusLabel: hasWarnings ? "Partial" : "Active",
    syncStatus: latest.status,
    syncError: hasWarnings ? "Manifest processed with anomalies" : null,
    lastSyncAt: latest.createdAt,
    countText: `${importJobs.length} Processed Manifests`,
    syncMessage: hasWarnings ? "Schema anomalies detected" : "Manifest integrity verified",
  };
}

export function IntegrationsDashboardClient({
  channels,
  importJobs,
}: {
  channels: Channel[];
  importJobs: ImportJob[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeType, setActiveType] = useState<string | null>(null);

  function runAction(
    type: string,
    label: string,
    task: () => Promise<{ success: boolean; error?: string }>
  ) {
    setActiveType(type);
    startTransition(async () => {
      const result = await task();
      if (!result.success) {
        toast.error(result.error || `${label} failed.`);
        setActiveType(null);
        return;
      }

      toast.success(label);
      setActiveType(null);
      router.refresh();
    });
  }

  const channelByType = new Map(channels.map((channel) => [channel.type, channel]));
  const importSummary = summarizeImportCard(importJobs);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
            Neural <span className="text-primary">Integrations</span>
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-medium text-on-surface-variant font-body-md">
            Authorize marketplaces, ingest spreadsheet manifests, and maintain global inventory synchronization across all external nodes.
          </p>
        </div>
        <Button variant="outline" disabled={isPending} onClick={() => router.refresh()} className="h-10 rounded-xl px-6">
          <span className="material-symbols-outlined text-[18px] mr-2">sync</span>
          Triage Status
        </Button>
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        {CARD_CONFIGS.map((card) => {
          const channel = card.type === "CSV" ? null : channelByType.get(card.type) ?? null;
          const isCsv = card.type === "CSV";
          const syncStatus = isCsv ? importSummary.syncStatus : channel?.syncStatus ?? "NOT_CONNECTED";
          const syncError = isCsv ? importSummary.syncError : channel?.syncError ?? null;
          const lastSyncAt = isCsv ? importSummary.lastSyncAt : channel?.lastSyncAt ?? null;
          const connected = isCsv ? importSummary.connected : Boolean(channel);
          const statusLabel = isCsv ? importSummary.statusLabel : channel?.statusLabel ?? "Inactive";
          const syncMessage = isCsv ? importSummary.syncMessage : channel?.syncMessage ?? "Awaiting Sync";
          const warnings = isCsv ? [] : channel?.warnings ?? [];
          const countText = isCsv
            ? importSummary.countText
            : `${channel?.counts.productMaps ?? 0} SKUs, ${channel?.counts.orderMaps ?? 0} Invoices`;
          const busy = isPending && activeType === card.type;

          return (
            <Card
              key={card.type}
              className="relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-soft"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", card.gradient)} />
              <CardHeader className="relative pb-6 border-b border-outline-variant/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl border border-outline-variant/20 bg-surface shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[32px]">{card.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black text-on-surface tracking-tight font-headline-sm">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="max-w-md text-xs font-medium text-on-surface-variant italic">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusVariant(syncStatus)} className="font-black uppercase tracking-widest text-[9px] px-3 py-0.5 rounded-full">
                      {statusLabel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative pt-8 space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      Authorization
                    </p>
                    <p className="mt-2 text-sm font-black text-on-surface">
                      {connected ? "IDENTIFIED" : "UNAUTHORIZED"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-on-surface-variant italic">
                      {countText}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      Last Handshake
                    </p>
                    <p className="mt-2 text-sm font-black text-on-surface">
                      {formatDate(lastSyncAt)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-on-surface-variant italic">
                      {syncMessage}
                    </p>
                  </div>
                </div>

                {syncError ? (
                  <div className="rounded-2xl border border-error/20 bg-error/5 p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-error text-[20px]">error</span>
                    <div>
                      <p className="text-[10px] font-black text-error uppercase tracking-widest">Protocol Exception</p>
                      <p className="text-xs font-medium text-on-surface-variant mt-0.5">{syncError}</p>
                    </div>
                  </div>
                ) : warnings.length > 0 ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Action Required</p>
                      <p className="text-xs font-medium text-on-surface-variant mt-0.5">{warnings[0]}</p>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <Button asChild variant="outline" className="h-10 rounded-xl justify-start text-[10px] font-black uppercase tracking-widest px-4">
                    <Link href={card.connectHref}>
                      <span className="material-symbols-outlined text-[18px] mr-2">vpn_key</span>
                      {card.connectLabel}
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-10 rounded-xl justify-start text-[10px] font-black uppercase tracking-widest px-4"
                    disabled={busy || (!isCsv && !channel?.id)}
                    onClick={() => {
                      if (isCsv) { router.push("/imports"); return; }
                      if (channel?.id)
                        runAction(
                          card.type,
                          "Node connection verified successfully",
                          () => testSalesChannelConnection({ channelId: channel.id })
                        )
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">verified</span>
                    {busy ? "Triaging..." : card.testLabel}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-10 rounded-xl justify-start text-[10px] font-black uppercase tracking-widest px-4"
                    disabled={busy || (!isCsv && !channel?.id)}
                    onClick={() => {
                       if (isCsv) { router.push("/imports"); return; }
                       if (channel?.id)
                        runAction(card.type, "Catalog synchronization initialized", () =>
                          syncSalesChannelProducts({ channelId: channel.id })
                        )
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">sync_alt</span>
                    {card.productsLabel}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-10 rounded-xl justify-start text-[10px] font-black uppercase tracking-widest px-4"
                    disabled={busy || (!isCsv && !channel?.id)}
                    onClick={() => {
                       if (isCsv) { router.push("/imports"); return; }
                       if (channel?.id)
                        runAction(card.type, "Invoice ingestion started", () =>
                          syncSalesChannelOrders({ channelId: channel.id })
                        )
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">inbox</span>
                    {card.ordersLabel}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-10 rounded-xl justify-start text-[10px] font-black uppercase tracking-widest px-4"
                    disabled={busy || (!isCsv && !channel?.id)}
                    onClick={() => {
                       if (isCsv) { router.push("/imports"); return; }
                       if (channel?.id)
                        runAction(
                          card.type,
                          "Inventory push sequence active",
                          () => pushSalesChannelInventory({ channelId: channel.id })
                        )
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">upload</span>
                    {card.inventoryLabel}
                  </Button>

                  <Button asChild variant="ghost" className="h-10 rounded-xl justify-start text-[10px] font-black uppercase tracking-widest px-4">
                    <Link href={card.logsHref}>
                      <span className="material-symbols-outlined text-[18px] mr-2">database</span>
                      Node History
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
