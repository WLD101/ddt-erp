import process from "node:process";

if (!process.env.DIRECT_URL) {
  console.error("DIRECT_URL is required for live schema verification.");
  process.exit(1);
}

process.env.DATABASE_URL = process.env.DIRECT_URL;

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const expectedMigrations = [
  "202607220001_industry_profile_onboarding",
  "202607220002_shared_integration_foundation",
  "202607220003_market_profile_foundation",
  "202607220004_integration_runtime_hardening",
  "202607230001_vapi_call_tracking",
  "202607240001_voice_privacy_controls",
];

const expectedTables = [
  "IntegrationProvider",
  "TenantIntegration",
  "IntegrationResource",
  "IntegrationPermission",
  "IntegrationSyncJob",
  "IntegrationEvent",
  "IntegrationActionLog",
  "IntegrationActionExecution",
  "IntegrationApprovalRequest",
  "IntegrationHealthCheck",
  "IntegrationRateLimitCounter",
  "IntegrationFieldMapping",
  "IntegrationUsageRecord",
  "IntegrationOAuthState",
  "IntegrationWebhookEndpoint",
  "IntegrationWebhookDelivery",
  "VoiceCallLog",
  "VoiceWebhookEvent",
  "VoiceJob",
];

const expectedColumns = [
  ["Organization", "industryProfileKey"],
  ["Organization", "marketKey"],
  ["Organization", "locale"],
  ["Organization", "countryCode"],
  ["Organization", "pricingProfile"],
  ["Organization", "complianceProfile"],
  ["Organization", "marketRequiresReview"],
  ["OnboardingState", "selectedMarketKey"],
  ["OnboardingState", "operationalAnswersJson"],
  ["OnboardingState", "recommendedProfileKey"],
  ["TenantIntegration", "lastHealthCheckAt"],
  ["TenantIntegration", "credentialCheckedAt"],
  ["TenantIntegration", "refreshLeaseOwner"],
  ["TenantIntegration", "refreshLeaseExpiresAt"],
  ["IntegrationSyncJob", "leaseOwner"],
  ["IntegrationSyncJob", "leaseExpiresAt"],
  ["IntegrationSyncJob", "nextAttemptAt"],
  ["IntegrationSyncJob", "lastErrorAt"],
  ["IntegrationSyncJob", "cancelRequestedAt"],
  ["IntegrationEvent", "leaseOwner"],
  ["IntegrationEvent", "leaseExpiresAt"],
  ["IntegrationEvent", "nextAttemptAt"],
  ["IntegrationEvent", "lastAttemptAt"],
  ["IntegrationEvent", "deadLetteredAt"],
  ["IntegrationEvent", "processingNotes"],
  ["VoiceCallLog", "externalCallKey"],
  ["VoiceCallLog", "callOutcome"],
  ["VoiceCallLog", "reconciliationStatus"],
  ["VoiceCallLog", "recordingDisclosureStatus"],
  ["VoiceCallLog", "recordingDisclosureCompletedAt"],
  ["VoiceCallLog", "privacyPolicySnapshot"],
  ["VoiceWebhookEvent", "encryptedPayload"],
  ["VoiceWebhookEvent", "deduplicationKey"],
  ["VoiceWebhookEvent", "leaseOwner"],
  ["VoiceWebhookEvent", "deadLetteredAt"],
  ["VoiceReceptionistSettings", "recordingEnabled"],
  ["VoiceReceptionistSettings", "recordingDisclosureEnabled"],
  ["VoiceReceptionistSettings", "recordingDisclosureText"],
  ["VoiceReceptionistSettings", "transcriptionEnabled"],
  ["VoiceReceptionistSettings", "recordingRetentionDays"],
  ["VoiceReceptionistSettings", "transcriptRetentionDays"],
  ["VoiceReceptionistSettings", "allowRecordingPlayback"],
  ["VoiceReceptionistSettings", "allowTranscriptAccess"],
];

function asNumber(value) {
  return Number(typeof value === "bigint" ? value : value ?? 0);
}

try {
  const [databaseIdentity] = await prisma.$queryRaw`
    SELECT
      current_database() AS "databaseName",
      current_user AS "databaseUser",
      inet_server_port() AS "serverPort"
  `;
  const migrations = await prisma.$queryRaw`
    SELECT "migration_name", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
    ORDER BY "migration_name"
  `;
  const applied = new Set(
    migrations
      .filter((row) => row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name),
  );
  const missingMigrations = expectedMigrations.filter((name) => !applied.has(name));

  const tables = await prisma.$queryRaw`
    SELECT "table_name"
    FROM "information_schema"."tables"
    WHERE "table_schema" = 'public'
  `;
  const presentTables = new Set(tables.map((row) => row.table_name));
  const missingTables = expectedTables.filter((name) => !presentTables.has(name));

  const columns = await prisma.$queryRaw`
    SELECT "table_name", "column_name"
    FROM "information_schema"."columns"
    WHERE "table_schema" = 'public'
  `;
  const presentColumns = new Set(
    columns.map((row) => `${row.table_name}.${row.column_name}`),
  );
  const missingColumns = expectedColumns
    .map(([table, column]) => `${table}.${column}`)
    .filter((key) => !presentColumns.has(key));

  const [organizationSummary] = await prisma.$queryRaw`
    SELECT
      COUNT(*) AS "tenants",
      COUNT(*) FILTER (WHERE "industryProfileKey" IS NOT NULL) AS "industryProfilesValid",
      COUNT(*) FILTER (WHERE "marketKey" IN ('uk', 'pk')) AS "marketProfilesValid",
      COUNT(*) FILTER (WHERE "marketRequiresReview" = true) AS "manualReviewRequired",
      (SELECT COUNT(*) FROM "Branch") AS "branches",
      (
        SELECT COUNT(*)
        FROM "User"
        WHERE "authStatus" = 'verified' AND "deletedAt" IS NULL
      ) AS "activeUsers"
    FROM "Organization"
  `;

  const [relationSummary] = await prisma.$queryRaw`
    WITH "relationChecks" AS (
      SELECT
        COUNT(*) FILTER (WHERE o."id" IS NULL) AS "brokenRelations",
        0::bigint AS "crossTenantIssues"
      FROM "TenantIntegration" child
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationResource" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationPermission" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationSyncJob" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationEvent" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationActionLog" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationActionExecution" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationApprovalRequest" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationHealthCheck" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationFieldMapping" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE ti."id" IS NULL),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationUsageRecord" child
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (
          WHERE o."id" IS NULL
            OR (
              child."tenantIntegrationId" IS NOT NULL
              AND ti."id" IS NULL
            )
        ),
        COUNT(*) FILTER (
          WHERE ti."id" IS NOT NULL
            AND child."organizationId" <> ti."organizationId"
        )
      FROM "IntegrationRateLimitCounter" child
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"
      LEFT JOIN "TenantIntegration" ti ON ti."id" = child."tenantIntegrationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE o."id" IS NULL),
        0::bigint
      FROM "IntegrationOAuthState" child
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE o."id" IS NULL),
        0::bigint
      FROM "IntegrationWebhookEndpoint" child
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE endpoint."id" IS NULL OR o."id" IS NULL),
        COUNT(*) FILTER (
          WHERE endpoint."id" IS NOT NULL
            AND child."organizationId" <> endpoint."organizationId"
        )
      FROM "IntegrationWebhookDelivery" child
      LEFT JOIN "IntegrationWebhookEndpoint" endpoint
        ON endpoint."id" = child."integrationWebhookEndpointId"
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (WHERE o."id" IS NULL),
        0::bigint
      FROM "VoiceCallLog" child
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"

      UNION ALL

      SELECT
        COUNT(*) FILTER (
          WHERE child."organizationId" IS NOT NULL AND o."id" IS NULL
        ),
        0::bigint
      FROM "VoiceWebhookEvent" child
      LEFT JOIN "Organization" o ON o."id" = child."organizationId"
    )
    SELECT
      COALESCE(SUM("brokenRelations"), 0) AS "brokenRelations",
      COALESCE(SUM("crossTenantIssues"), 0) AS "crossTenantIssues"
    FROM "relationChecks"
  `;
  const [privacySummary] = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (
        WHERE settings."recordingEnabled" = true
          AND settings."recordingDisclosureEnabled" = true
          AND NULLIF(BTRIM(settings."recordingDisclosureText"), '') IS NULL
      ) AS "invalidDisclosureConfigurations",
      (
        SELECT COUNT(*)
        FROM "VoiceCallLog" calls
        LEFT JOIN "VoiceReceptionistSettings" tenant_settings
          ON tenant_settings."organizationId" = calls."organizationId"
        WHERE calls."recordingUrl" IS NOT NULL
          AND (
            tenant_settings."recordingEnabled" IS DISTINCT FROM true
            OR (
              tenant_settings."recordingDisclosureEnabled" = true
              AND calls."recordingDisclosureStatus" <> 'completed'
            )
          )
      ) AS "recordingsOutsidePolicy",
      (
        SELECT COUNT(*)
        FROM "VoiceCallLog" calls
        LEFT JOIN "VoiceReceptionistSettings" tenant_settings
          ON tenant_settings."organizationId" = calls."organizationId"
        WHERE calls."transcript" IS NOT NULL
          AND tenant_settings."transcriptionEnabled" IS DISTINCT FROM true
      ) AS "transcriptsOutsidePolicy"
    FROM "VoiceReceptionistSettings" settings
  `;

  const report = {
    database: {
      name: databaseIdentity.databaseName,
      user: databaseIdentity.databaseUser,
      port: asNumber(databaseIdentity.serverPort),
    },
    migrations: {
      expected: expectedMigrations.length,
      applied: applied.size,
      missing: missingMigrations,
    },
    schema: {
      expectedTables: expectedTables.length,
      missingTables,
      expectedColumns: expectedColumns.length,
      missingColumns,
    },
    tenants: {
      checked: asNumber(organizationSummary.tenants),
      branches: asNumber(organizationSummary.branches),
      activeUsers: asNumber(organizationSummary.activeUsers),
      industryProfilesValid: asNumber(organizationSummary.industryProfilesValid),
      marketProfilesValid: asNumber(organizationSummary.marketProfilesValid),
      manualReviewRequired: asNumber(organizationSummary.manualReviewRequired),
      brokenRelations: asNumber(relationSummary.brokenRelations),
      crossTenantIssues: asNumber(relationSummary.crossTenantIssues),
    },
    privacy: {
      invalidDisclosureConfigurations: asNumber(
        privacySummary.invalidDisclosureConfigurations,
      ),
      recordingsOutsidePolicy: asNumber(
        privacySummary.recordingsOutsidePolicy,
      ),
      transcriptsOutsidePolicy: asNumber(
        privacySummary.transcriptsOutsidePolicy,
      ),
    },
  };

  console.log(JSON.stringify(report, null, 2));

  const expectedDatabase = process.env.WHATSQUERY_EXPECTED_DATABASE_NAME;
  const expectedTenants = process.env.WHATSQUERY_EXPECTED_TENANT_COUNT;
  if (
    (expectedDatabase &&
      report.database.name !== expectedDatabase) ||
    (expectedTenants &&
      report.tenants.checked !== Number(expectedTenants)) ||
    missingMigrations.length ||
    missingTables.length ||
    missingColumns.length ||
    report.tenants.brokenRelations ||
    report.tenants.crossTenantIssues ||
    report.privacy.invalidDisclosureConfigurations ||
    report.privacy.recordingsOutsidePolicy ||
    report.privacy.transcriptsOutsidePolicy
  ) {
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
