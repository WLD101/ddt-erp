"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  Link2,
  PackageSearch,
  RefreshCcw,
  Send,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type DarazChannel = {
  id: string;
  name: string;
  type: "DARAZ" | "SHOPIFY" | "WOOCOMMERCE" | "CSV";
  isActive: boolean;
  syncStatus: string;
  syncError: string | null;
  lastSyncAt: Date | string | null;
  configuration: Record<string, unknown>;
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

type DarazProductRow = {
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  stockQuantity: number;
  categoryName: string | null;
  mappingStatus: "NOT_MAPPED" | "MAPPED" | "PUBLISHED" | "DEMO_PUBLISHED";
  categoryStatus: "READY" | "MISSING";
  missingFields: string[];
  canPublish: boolean;
  externalProductId: string | null;
  externalSku: string | null;
  validationLabel: string;
};

type Props = {
  initialChannel: DarazChannel | null;
  initialLogs: SyncLogPayload | null;
  productRows: DarazProductRow[];
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
  if (status === "SUCCESS" || status === "PUBLISHED" || status === "DEMO_PUBLISHED") return "default";
  if (status === "FAILED" || status === "MISSING") return "destructive";
  if (status === "SYNCING" || status === "CONNECTING" || status === "PENDING" || status === "MAPPED") return "secondary";
  return "outline";
}

function prettyJson(value: unknown) {
  if (!value || typeof value !== "object") {
    return "{}";
  }

  return JSON.stringify(value, null, 2);
}

function parseJsonText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }

    return parsed;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : `${label} contains invalid JSON.`);
  }
}

export function DarazSettingsClient({ initialChannel, initialLogs, productRows }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [name, setName] = useState(initialChannel?.name ?? "Daraz Marketplace");
  const [sellerId, setSellerId] = useState("");
  const [shopId, setShopId] = useState(String(initialChannel?.configuration.shopId ?? ""));
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(String(initialChannel?.configuration.apiBaseUrl ?? ""));
  const [useMock, setUseMock] = useState(Boolean(initialChannel?.configuration.useMock ?? true));
  const [defaultCategoryExternalId, setDefaultCategoryExternalId] = useState(
    String(initialChannel?.configuration.defaultCategoryExternalId ?? "")
  );
  const [defaultProductDescription, setDefaultProductDescription] = useState(
    String(initialChannel?.configuration.defaultProductDescription ?? "")
  );
  const [defaultImageUrl, setDefaultImageUrl] = useState(
    String(initialChannel?.configuration.defaultImageUrl ?? "")
  );
  const [defaultAttributesJson, setDefaultAttributesJson] = useState(
    prettyJson(initialChannel?.configuration.defaultAttributes ?? {})
  );
  const [categoryMappingsJson, setCategoryMappingsJson] = useState(
    prettyJson(initialChannel?.configuration.categoryMappings ?? {})
  );
  const [notes, setNotes] = useState(String(initialChannel?.configuration.notes ?? ""));

  const channel = initialChannel;
  const logs = initialLogs;
  const mappingWarnings = productRows.filter((product) => !product.canPublish).length;

  const activeCredentialSummary = useMemo(() => {
    if (!channel?.hasCredentials) {
      return "No credentials saved yet.";
    }

    return `Stored securely: ${channel.credentialKeys.join(", ")}`;
  }, [channel]);

  function buildCredentials() {
    return Object.fromEntries(
      Object.entries({
        sellerId,
        appKey,
        appSecret,
        accessToken,
        refreshToken,
      }).filter(([, value]) => value.trim().length > 0)
    );
  }

  function buildConfiguration() {
    return {
      apiBaseUrl: apiBaseUrl.trim() || null,
      shopId: shopId.trim() || null,
      useMock,
      defaultCategoryExternalId: defaultCategoryExternalId.trim() || null,
      defaultProductDescription: defaultProductDescription.trim() || null,
      defaultImageUrl: defaultImageUrl.trim() || null,
      defaultAttributes: parseJsonText(defaultAttributesJson, "Default attributes"),
      categoryMappings: parseJsonText(categoryMappingsJson, "Category mappings"),
      notes: notes.trim() || null,
    };
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

  async function saveConnection() {
    try {
      const configuration = buildConfiguration();
      await runAction("Daraz connection saved", () =>
        connectSalesChannel({
          id: channel?.id,
          name,
          type: "DARAZ",
          isActive: true,
          credentials: buildCredentials(),
          configuration,
        })
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save Daraz configuration.");
    }
  }

  function publishProduct(productId: string) {
    startTransition(async () => {
      try {
        setPendingProductId(productId);
        const response = await fetch("/api/integrations/daraz/products/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelId: channel?.id,
            productId,
          }),
        });

        const payload = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
          missingFields?: string[];
          demoMode?: boolean;
        };

        if (!response.ok || !payload.success) {
          const detail =
            payload.missingFields && payload.missingFields.length > 0
              ? ` Missing: ${payload.missingFields.join(", ")}.`
              : "";
          toast.error((payload.error || payload.message || "Daraz category mapping required before publishing") + detail);
          return;
        }

        toast.success(payload.demoMode ? "Product demo-published to Daraz" : "Product published to Daraz");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Daraz publish failed.");
      } finally {
        setPendingProductId(null);
      }
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface uppercase italic">
            Daraz <span className="text-primary">Marketplace</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect a tenant Daraz seller account, publish products safely, and keep credentials server-only for demo and live operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(channel?.syncStatus ?? "IDLE")}>
            {channel?.statusLabel ?? "Not connected"}
          </Badge>
          <Badge variant="outline">{channel?.isActive ? "Active" : "Inactive"}</Badge>
          <Badge variant="outline">{useMock ? "Demo Mode" : "Live Mode"}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-outline-variant/30 bg-surface-container-high backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-on-surface">
              <Store className="h-5 w-5 text-primary" />
              Daraz Connection
            </CardTitle>
            <CardDescription>
              Save encrypted Daraz Open Platform credentials and optional category mappings. Tokens are never shown after they are saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daraz-name">Connection name</Label>
                <Input id="daraz-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-seller-id">Seller ID</Label>
                <Input
                  id="daraz-seller-id"
                  value={sellerId}
                  onChange={(event) => setSellerId(event.target.value)}
                  placeholder={channel?.hasCredentials ? "Saved securely" : "daraz-seller-id"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-shop-id">Shop identifier</Label>
                <Input id="daraz-shop-id" value={shopId} onChange={(event) => setShopId(event.target.value)} placeholder="northstar-daraz-store" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-base-url">API base URL</Label>
                <Input
                  id="daraz-base-url"
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                  placeholder="https://api.daraz.com/rest"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-app-key">App Key</Label>
                <Input id="daraz-app-key" value={appKey} onChange={(event) => setAppKey(event.target.value)} placeholder={channel?.credentialKeys.includes("appKey") ? "Saved securely" : "appKey"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-app-secret">App Secret</Label>
                <Input id="daraz-app-secret" type="password" value={appSecret} onChange={(event) => setAppSecret(event.target.value)} placeholder={channel?.credentialKeys.includes("appSecret") ? "Saved securely" : "appSecret"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-access-token">Access Token</Label>
                <Input id="daraz-access-token" type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder={channel?.credentialKeys.includes("accessToken") ? "Saved securely" : "accessToken"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-refresh-token">Refresh Token</Label>
                <Input id="daraz-refresh-token" type="password" value={refreshToken} onChange={(event) => setRefreshToken(event.target.value)} placeholder={channel?.credentialKeys.includes("refreshToken") ? "Saved securely" : "Optional refresh token"} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daraz-default-category">Default Daraz category ID</Label>
                <Input
                  id="daraz-default-category"
                  value={defaultCategoryExternalId}
                  onChange={(event) => setDefaultCategoryExternalId(event.target.value)}
                  placeholder="Use if many products share one Daraz category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-default-image">Default image URL</Label>
                <Input
                  id="daraz-default-image"
                  value={defaultImageUrl}
                  onChange={(event) => setDefaultImageUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daraz-default-description">Default publish description</Label>
              <Textarea
                id="daraz-default-description"
                value={defaultProductDescription}
                onChange={(event) => setDefaultProductDescription(event.target.value)}
                placeholder="Optional default product description for Daraz publishing."
                className="min-h-[92px] bg-surface-container-low"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daraz-default-attributes">Default attributes JSON</Label>
                <Textarea
                  id="daraz-default-attributes"
                  value={defaultAttributesJson}
                  onChange={(event) => setDefaultAttributesJson(event.target.value)}
                  placeholder={`{\n  "brand": "Northstar",\n  "warranty_type": "No Warranty"\n}`}
                  className="min-h-[160px] bg-surface-container-low font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daraz-category-mappings">Category mappings JSON</Label>
                <Textarea
                  id="daraz-category-mappings"
                  value={categoryMappingsJson}
                  onChange={(event) => setCategoryMappingsJson(event.target.value)}
                  placeholder={`{\n  "Electronics": {\n    "primaryCategory": "10000340",\n    "attributes": {\n      "brand": "Northstar"\n    }\n  }\n}`}
                  className="min-h-[160px] bg-surface-container-low font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-on-surface">Demo-safe mode</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, product publishing is simulated and rows are marked as Demo Published instead of calling live Daraz APIs.
                </p>
              </div>
              <Switch checked={useMock} onCheckedChange={setUseMock} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daraz-notes">Connection notes</Label>
              <Textarea
                id="daraz-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional operator notes for this tenant connection."
                className="min-h-[92px] bg-surface-container-low"
              />
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-on-surface">Stored credential status</p>
              <p className="mt-1 text-muted-foreground">{activeCredentialSummary}</p>
            </div>

            {channel?.connectionState === "DEMO" && !channel.hasCredentials ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                <p className="font-semibold text-on-surface">Mock mode is active</p>
                <p className="mt-1 text-amber-100">
                  Daraz is running in demo-safe mock mode because real seller credentials are not configured yet.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={isPending} onClick={saveConnection}>
                <Link2 className="mr-2 h-4 w-4" />
                Save Connection
              </Button>
              <Button
                variant="outline"
                disabled={isPending || !channel?.id}
                onClick={() =>
                  channel?.id &&
                  runAction("Daraz connection tested", () => testSalesChannelConnection({ channelId: channel.id }))
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
            <CardDescription>Quick visibility into the tenant&apos;s Daraz sync health and publish readiness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Last Sync</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{formatDate(channel?.lastSyncAt ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{channel?.syncMessage ?? "Ready for sync"}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Last Error</p>
                <p className="mt-2 text-sm font-semibold text-on-surface">{channel?.syncError || "No active issue"}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Imported Products</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{channel?.counts.productMaps ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Imported Orders</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{channel?.counts.orderMaps ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Sync Logs</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{channel?.counts.syncLogs ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Missing Mappings</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{mappingWarnings || channel?.counts.unmappedProducts || 0}</p>
              </div>
            </div>

            {mappingWarnings > 0 ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                <p className="font-semibold text-on-surface">Publishing warning</p>
                <p className="mt-1 text-amber-100">Daraz category mapping required before publishing.</p>
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
                  runAction("Daraz products synced", () => syncSalesChannelProducts({ channelId: channel.id }))
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
                  runAction("Daraz orders synced", () => syncSalesChannelOrders({ channelId: channel.id }))
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
                  runAction("Daraz inventory pushed", () => pushSalesChannelInventory({ channelId: channel.id }))
                }
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Push Inventory
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="#daraz-sync-logs">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Sync Logs
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start" disabled={isPending} onClick={() => router.refresh()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-outline-variant/30 bg-surface-container-high backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-on-surface">Publish Products to Daraz</CardTitle>
          <CardDescription>
            Review product readiness before publishing. Products must have SKU, price, stock, category mapping, and required Daraz attributes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {productRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/30 p-6 text-sm text-muted-foreground">
              No ERP products found yet for Daraz publishing.
            </div>
          ) : (
            <div className="space-y-3">
              {productRows.map((product) => (
                <div key={product.productId} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-semibold text-on-surface">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku || "Missing"} | Category: {product.categoryName || "Unassigned"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant(product.mappingStatus)}>{product.mappingStatus.replaceAll("_", " ")}</Badge>
                        <Badge variant={statusVariant(product.categoryStatus)}>{product.categoryStatus === "READY" ? "Category Ready" : "Category Missing"}</Badge>
                        <Badge variant="outline">Price ${product.price.toFixed(2)}</Badge>
                        <Badge variant="outline">Stock {product.stockQuantity}</Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className={product.canPublish ? "text-emerald-400" : "text-amber-300"}>{product.validationLabel}</p>
                        {product.missingFields.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Missing fields before publishing: {product.missingFields.join(", ")}.
                          </p>
                        ) : null}
                        {product.externalProductId ? (
                          <p className="text-xs text-muted-foreground">
                            Daraz Product ID: {product.externalProductId}
                            {product.externalSku ? ` | Seller SKU: ${product.externalSku}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={isPending || pendingProductId === product.productId || !channel?.id || !product.canPublish}
                        onClick={() => publishProduct(product.productId)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {pendingProductId === product.productId ? "Publishing..." : "Publish Product to Daraz"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="daraz-sync-logs" className="border-outline-variant/30 bg-surface-container-high backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-on-surface">Recent Daraz Sync Activity</CardTitle>
          <CardDescription>Adapter-level notes and persisted channel logs for this tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!logs && <p className="text-sm text-muted-foreground">No Daraz activity yet.</p>}

          {logs?.adapterLogs.length ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Adapter Notes</p>
              {logs.adapterLogs.map((log, index) => (
                <div key={`${log.message}-${index}`} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-sm text-on-surface">
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
                <div key={log.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 text-sm text-on-surface">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                    <Badge variant="outline">{log.entityType}</Badge>
                    <Badge variant="outline">{log.direction}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
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
