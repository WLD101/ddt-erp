import { INDUSTRY_PROFILES, type IndustryProfileKey } from "@/modules/onboarding/industry-profiles";

import { listAvailableProviderDefinitions } from "./registry";
import { toIntegrationRecommendationLevel, type IntegrationProviderCatalogEntry, type IntegrationRecommendationLevel } from "./types";

const PROVIDER_RECOMMENDATION_ALIASES: Record<string, string> = {
  google_calendar: "google_workspace",
  google_contacts: "google_workspace",
  gmail: "google_workspace",
  google_sheets: "google_workspace",
};

export function getIntegrationRecommendations(input: {
  industryProfileKey?: IndustryProfileKey | null;
  connectedProviderKeys?: string[];
}) {
  const connectedProviderKeys = new Set(input.connectedProviderKeys || []);
  const profile = input.industryProfileKey ? INDUSTRY_PROFILES[input.industryProfileKey] : null;
  const profileRecommendations = new Map(
    (profile?.recommendedIntegrations || []).map((recommendation) => [
      PROVIDER_RECOMMENDATION_ALIASES[recommendation.key] || recommendation.key,
      recommendation,
    ])
  );

  return listAvailableProviderDefinitions().map((provider): IntegrationProviderCatalogEntry => {
    const directRecommendation = profileRecommendations.get(provider.key);
    const level: IntegrationRecommendationLevel = directRecommendation
      ? toIntegrationRecommendationLevel(directRecommendation.level)
      : provider.status === "development"
        ? "coming_soon"
        : "optional";

    return {
      key: provider.key,
      name: provider.name,
      description: provider.description,
      category: provider.category,
      status: provider.status,
      implementationState:
        provider.key === "internal_test"
          ? "internal_only"
          : provider.status === "development"
            ? "in_development"
            : "working",
      recommendationLevel: connectedProviderKeys.has(provider.key) ? "essential" : level,
      recommendationReason: directRecommendation?.reason,
      supportedCapabilities: provider.capabilities,
      canConnect: provider.key === "internal_test",
      featureFlag: provider.featureFlag,
    };
  });
}
