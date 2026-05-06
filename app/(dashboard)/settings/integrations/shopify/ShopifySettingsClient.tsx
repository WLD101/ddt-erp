"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  CloudUpload,
  Link2,
  PackageSearch,
  RefreshCcw,
  ShoppingBag,
  Store,
} from "lucide-react";

import {
  connectSalesChannel,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type ShopifyChannel = {
  id: string;
  name: string;
  type: "DARAZ" | "SHOPIFY" | "WOOCOMMERCE" | "CSV";
  isActive: boolean;
  syncStatus: string;
  syncError: string | null;
  lastSyncAt: Date | string | null;
  configuration: Record<string, string | number | boolean | null>;
  credentialKeys: string[];
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

type SyncLogPayload = {
  adapterLogs: Array<{ status: string; message: string }>;
  databaseLogs: Array<{
    id: string;
    direction: string;
    entityType: string;
    status: string;
    message: string;
    createdAt: Date | string;
  }>;
};

type Props = {
  initialChannel: ShopifyChannel | null;
  initialLogs: SyncLogPayload | null;
};

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Never";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusVariant(status: string) {
  if (status === "SUCCESS") return "default";
  if (status === "FAILED") return "destructive";
  if (status === "SYNCING" || status === "CONNECTING" || status === "PENDING")
    return "secondary";
  return "outline";
}

export function ShopifySettingsClient({
  initialChannel,
  initialLogs,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(
    initialChannel?.name ?? "Shopify Demo Channel"
  );
  const [shopDomain, setShopDomain] = useState("");
  const [adminAccessToken, setAdminAccessToken] = useState("");
  const [apiVersion, setApiVersion] = useState(
    String(initialChannel?.configuration.apiVersion ?? "")
  );
  const [useMock, setUseMock] = useState(
    Boolean(initialChannel?.configuration.useMock ?? true)
  );
  const [notes, setNotes] = useState(
    String(initialChannel?.configuration.notes ?? "Demo data clearly labeled")
  );

  const channel = initialChannel;
  const logs = initialLogs;

  const activeCredentialSummary = useMemo(() => {
    if (!channel?.hasCredentials) {
      return "No Shopify credentials saved yet.";
    }
    return `Stored securely: ${channel.credentialKeys.join(", ")}`;
  }, [channel]);

  function buildCredentials() {
    return Object.fromEntries(
      Object.entries({
        shopDomain,
        adminAccessToken,
      }).filter(([, value]) => value.trim().length > 0)
    );
  }

  async function runAction<T>(
    label: string,
    task: () => Promise<{ success: boolean; error?: string; data?: T }>
  ) {
    startTransition(async () => {
      const result = await task();
      if (!result.success) {
        toast.error(result.error || `${label} failed.`);
        return;
      }
      toast.success(label);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface uppercase italic">
            Shopify <span className="text-primary">Integration</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect a Shopify store with an admin token, sync products and orders,
            and push ERP inventory back to mapped variants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(channel?.syncStatus ?? "IDLE")}>
            {channel?.statusLabel ?? "Not connected"}
          </Badge>
          <Badge variant="outline">{channel?.isActive ? "Active" : "Inactive"}</Badge>
          {channel?.connectionState === "DEMO" ? <Badge variant="outline">Demo</Badge> : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-outline-variant/30 bg-surface-container-high backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-on-surface">
              <Store className="h-5 w-5 text-primary" />
              Shopify Connection
            </CardTitle>
            <CardDescription>
              Save the store domain and admin token in encrypted storage. Tokens remain write-only after save.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shopify-name">Connection name</Label>
                <Input
                  id="shopify-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopify-domain">Shop Domain</Label>
                <Input
                  id="shopify-domain"
                  value={shopDomain}
                  onChange={(event) => setShopDomain(event.target.value)}
                  placeholder={
                    channel?.credentialKeys.includes("shopDomain")
                      ? "Saved securely"
                      : "example.myshopify.com"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopify-token">Admin Access Token</Label>
                <Input
                  id="shopify-token"
                  type="password"
                  value={adminAccessToken}
                  onChange={(event) => setAdminAccessToken(event.target.value)}
                  placeholder={
                    channel?.credentialKeys.includes("adminAccessToken") ||
                    channel?.credentialKeys.includes("accessToken")
                      ? "Saved securely"
                      : "shpat_xxx"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopify-api-version">API Version</Label>
                <Input
                  id="shopify-api-version"
                  value={apiVersion}
                  onChange={(event) => setApiVersion(event.target.value)}
                  placeholder="2025-01"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-on-surface">Demo-safe mock mode</p>
                <p className="text-xs text-muted-foreground">
                  Enables a clearly labeled fake Shopify channel with sample products and orders for tomorrow&apos;s demos.
                </p>
              </div>
              <Switch checked={useMock} onCheckedChange={setUseMock} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopify-notes">Connection notes</Label>
              <Textarea
                id="shopify-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional operator notes. Use this to label demo data clearly."
                className="min-h-[92px] bg-surface-container-low"
              />
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-on-surface">Stored credential status</p>
              <p className="mt-1 text-muted-foreground">{activeCredentialSummary}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isPending}
                onClick={() =>
                  runAction("Shopify connection saved", () =>
                    connectSalesChannel({
                      id: channel?.id,
                      name,
                      type: "SHOPIFY",
                      isActive: true,
                      credentials: buildCredentials(),
                      configuration: {
                        apiVersion: apiVersion.trim() || null,
                        useMock,
                        notes: notes.trim() || null,
                      },
                    })
                  )
                }
              >
                <Link2 className="mr-2 h-4 w-4" />
                Save Connection
              </Button>
              <Button
                variant="outline"
                disabled={isPending || !channel?.id}
                onClick={() =>
                  channel?.id &&
                  runAction("Shopify store verified successfully", () =>
                    testSalesChannelConnection({ channelId: channel.id })
                  )
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/30 bg-surface-container-high backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-on-surface">Channel Snapshot</CardTitle>
            <CardDescription>Quick visibility into the tenant&apos;s Shopify sync health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Last Sync</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  {formatDate(channel?.lastSyncAt ?? null)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{channel?.syncMessage ?? "Ready for sync"}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Last Error</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  {channel?.syncError || "No active issue"}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Imported Products</p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {channel?.counts.productMaps ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Imported Orders</p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {channel?.counts.orderMaps ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Sync Logs</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{channel?.counts.syncLogs ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Missing Mappings</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{channel?.counts.unmappedProducts ?? 0}</p>
              </div>
            </div>

            {channel?.warnings?.length ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                <p className="font-semibold text-on-surface">Inventory push warning</p>
                <p className="mt-1 text-amber-100">{channel.warnings[0]}</p>
              </div>
            ) : null}

            <Separator className="bg-surface-container" />

            <div className="grid gap-3">
              <Button
                variant="outline"
                className="justify-start"
                disabled={isPending || !channel?.id}
                onClick={() =>
                  channel?.id &&
                  runAction("Shopify products synced", () =>
                    syncSalesChannelProducts({ channelId: channel.id })
                  )
                }
              >
                <PackageSearch className="mr-2 h-4 w-4" />
                Sync Products
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled={isPending || !channel?.id}
                onClick={() =>
                  channel?.id &&
                  runAction("Shopify orders synced", () =>
                    syncSalesChannelOrders({ channelId: channel.id })
                  )
                }
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Sync Orders
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                disabled={isPending || !channel?.id}
                onClick={() =>
                  channel?.id &&
                  runAction("Shopify inventory sync completed", () =>
                    pushSalesChannelInventory({ channelId: channel.id })
                  )
                }
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Push Inventory
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                disabled={isPending}
                onClick={() => router.refresh()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-outline-variant/30 bg-surface-container-high backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-on-surface">Recent Shopify Sync Activity</CardTitle>
          <CardDescription>Adapter-level notes and persisted channel logs for this tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!logs && <p className="text-sm text-muted-foreground">No Shopify activity yet.</p>}

          {logs?.adapterLogs.length ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Adapter Notes</p>
              {logs.adapterLogs.map((log, index) => (
                <div
                  key={`${log.message}-${index}`}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-sm text-on-surface"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                  </div>
                  <p>{log.message}</p>
                </div>
              ))}
            </div>
          ) : null}

          {logs?.databaseLogs.length ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Persisted Logs</p>
              {logs.databaseLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-sm text-on-surface"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    <Badge variant="outline">{log.entityType}</Badge>
                    <Badge variant="outline">{log.direction}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p>{log.message}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
