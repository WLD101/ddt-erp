import process from "node:process";

if (!process.env.DIRECT_URL) {
  console.error("DIRECT_URL is required for database preflight.");
  process.exit(1);
}

process.env.DATABASE_URL = process.env.DIRECT_URL;
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

function asNumber(value) {
  return Number(typeof value === "bigint" ? value : value ?? 0);
}

try {
  const [identity] = await prisma.$queryRaw`
    SELECT
      current_database() AS "databaseName",
      current_user AS "databaseUser",
      inet_server_port() AS "serverPort"
  `;
  const [counts] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM "Organization") AS "tenants",
      (SELECT COUNT(*) FROM "User") AS "users",
      (SELECT COUNT(*) FROM "Branch") AS "branches",
      (SELECT COUNT(*) FROM "VoiceCallLog") AS "voiceCalls",
      (SELECT COUNT(*) FROM "_prisma_migrations") AS "migrationRecords"
  `;
  const failedMigrations = await prisma.$queryRaw`
    SELECT "migration_name"
    FROM "_prisma_migrations"
    WHERE "finished_at" IS NULL
      AND "rolled_back_at" IS NULL
    ORDER BY "migration_name"
  `;
  const [marketRewrite] = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (
        WHERE LOWER(COALESCE("country", '')) LIKE '%pakistan%'
          OR UPPER(COALESCE("currency", '')) = 'PKR'
          OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
      ) AS "pakistanCandidates",
      COUNT(*) FILTER (
        WHERE LOWER(COALESCE("country", '')) IN (
          'united kingdom',
          'uk',
          'great britain',
          'britain'
        )
          OR UPPER(COALESCE("currency", '')) = 'GBP'
          OR LOWER(COALESCE("timezone", '')) = 'europe/london'
      ) AS "ukCandidates"
    FROM "Organization"
  `;

  const report = {
    database: {
      name: identity.databaseName,
      user: identity.databaseUser,
      port: asNumber(identity.serverPort),
    },
    existingData: {
      tenants: asNumber(counts.tenants),
      users: asNumber(counts.users),
      branches: asNumber(counts.branches),
      voiceCalls: asNumber(counts.voiceCalls),
      migrationRecords: asNumber(counts.migrationRecords),
    },
    marketRewriteCandidates: {
      pakistan: asNumber(marketRewrite.pakistanCandidates),
      unitedKingdom: asNumber(marketRewrite.ukCandidates),
    },
    failedMigrations: failedMigrations.map((row) => row.migration_name),
  };
  console.log(JSON.stringify(report, null, 2));

  const expectedDatabase = process.env.WHATSQUERY_EXPECTED_DATABASE_NAME;
  const expectedTenants = process.env.WHATSQUERY_EXPECTED_TENANT_COUNT;
  if (expectedDatabase && identity.databaseName !== expectedDatabase) {
    console.error("Database identity does not match WHATSQUERY_EXPECTED_DATABASE_NAME.");
    process.exitCode = 1;
  }
  if (
    expectedTenants &&
    asNumber(counts.tenants) !== Number(expectedTenants)
  ) {
    console.error("Tenant count does not match WHATSQUERY_EXPECTED_TENANT_COUNT.");
    process.exitCode = 1;
  }
  if (failedMigrations.length > 0) {
    console.error("Unresolved failed Prisma migrations were detected.");
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
