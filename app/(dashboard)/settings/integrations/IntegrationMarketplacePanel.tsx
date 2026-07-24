import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProviderCard = {
  key: string;
  name: string;
  description: string;
  category: string;
  status: string;
  implementationState: "working" | "internal_only" | "in_development";
  recommendationLevel: string;
  recommendationReason?: string;
  supportedCapabilities: string[];
  canConnect: boolean;
};

type TenantConnection = {
  id: string;
  providerKey: string;
  connectionName: string;
  status: string;
  healthStatus: string;
  externalAccountName?: string | null;
  grantedScopes: string[];
  lastTestedAt?: Date | null;
  lastSuccessfulAt?: Date | null;
};

function splitProviders(cards: ProviderCard[], connections: TenantConnection[]) {
  const connectedKeys = new Set(connections.map((connection) => connection.providerKey));

  return {
    recommended: cards.filter((card) => ["essential", "recommended"].includes(card.recommendationLevel) && !connectedKeys.has(card.key)),
    connected: cards.filter((card) => connectedKeys.has(card.key)),
    available: cards.filter((card) => !connectedKeys.has(card.key) && card.implementationState !== "in_development" && !["essential", "recommended"].includes(card.recommendationLevel)),
    inDevelopment: cards.filter((card) => card.implementationState === "in_development"),
    developerTools: cards.filter((card) => card.category === "developer_tools"),
  };
}

function ProviderGrid({
  title,
  description,
  cards,
  connectionsByProviderKey,
}: {
  title: string;
  description: string;
  cards: ProviderCard[];
  connectionsByProviderKey: Map<string, TenantConnection>;
}) {
  if (cards.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-black tracking-tight text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => {
          const connection = connectionsByProviderKey.get(card.key);
          return (
            <Card key={card.key} className="rounded-3xl border border-outline-variant/30 bg-surface shadow-soft">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-black">{card.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs text-on-surface-variant">
                      {card.description}
                    </CardDescription>
                  </div>
                  <Badge variant={card.implementationState === "in_development" ? "secondary" : "default"}>
                    {card.implementationState === "in_development" ? "In development" : connection ? connection.status : card.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  <span>{card.category.replaceAll("_", " ")}</span>
                  <span>{card.recommendationLevel.replaceAll("_", " ")}</span>
                  {connection ? <span>{connection.healthStatus}</span> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-on-surface">
                  {connection?.externalAccountName || card.recommendationReason || "Shared foundation is ready; provider-specific implementation is staged behind this layer."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.supportedCapabilities.slice(0, 4).map((capability) => (
                    <Badge key={capability} variant="outline" className="rounded-full">
                      {capability}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {connection ? (
                    <>
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link href={`/settings/integrations#connection-${connection.id}`}>Configure</Link>
                      </Button>
                      <Button variant="outline" disabled className="rounded-xl">
                        Test
                      </Button>
                      <Button variant="ghost" disabled className="rounded-xl">
                        Disconnect
                      </Button>
                    </>
                  ) : card.canConnect ? (
                    <Button variant="outline" disabled className="rounded-xl">
                      Connect (API Ready)
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="rounded-xl">
                      In development
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function IntegrationMarketplacePanel({
  providers,
  connections,
}: {
  providers: ProviderCard[];
  connections: TenantConnection[];
}) {
  const sections = splitProviders(providers, connections);
  const connectionsByProviderKey = new Map(connections.map((connection) => [connection.providerKey, connection]));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-on-surface font-headline-md uppercase">
          Integration <span className="text-primary">Marketplace</span>
        </h2>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          Recommended providers now come from your verified industry profile. Only the internal test provider is connectable at this stage; external providers remain clearly marked until their real adapters are complete.
        </p>
      </div>

      <ProviderGrid
        title="Recommended For Your Business"
        description="Profile-driven recommendations from the shared integration registry."
        cards={sections.recommended}
        connectionsByProviderKey={connectionsByProviderKey}
      />
      <ProviderGrid
        title="Connected"
        description="Active connections and their current health state."
        cards={sections.connected}
        connectionsByProviderKey={connectionsByProviderKey}
      />
      <ProviderGrid
        title="Available"
        description="Shared foundation is ready, but only development-safe connections are exposed."
        cards={sections.available}
        connectionsByProviderKey={connectionsByProviderKey}
      />
      <ProviderGrid
        title="In Development"
        description="Planned providers that are intentionally not shown as functional yet."
        cards={sections.inDevelopment}
        connectionsByProviderKey={connectionsByProviderKey}
      />
      <ProviderGrid
        title="Developer Tools"
        description="Webhooks, internal test provider, and future universal connectors."
        cards={sections.developerTools}
        connectionsByProviderKey={connectionsByProviderKey}
      />
    </div>
  );
}
