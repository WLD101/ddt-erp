ALTER TABLE "Organization"
ADD COLUMN "marketKey" TEXT,
ADD COLUMN "locale" TEXT,
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "pricingProfile" TEXT,
ADD COLUMN "complianceProfile" TEXT,
ADD COLUMN "marketRequiresReview" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "OnboardingState"
ADD COLUMN "selectedMarketKey" TEXT;

UPDATE "Organization"
SET
  "marketKey" = CASE
    WHEN LOWER(COALESCE("country", '')) LIKE '%pakistan%'
      OR UPPER(COALESCE("currency", '')) = 'PKR'
      OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
    THEN 'pk'
    WHEN LOWER(COALESCE("country", '')) IN ('united kingdom', 'uk', 'great britain', 'britain')
      OR UPPER(COALESCE("currency", '')) = 'GBP'
      OR LOWER(COALESCE("timezone", '')) = 'europe/london'
    THEN 'uk'
    ELSE NULL
  END,
  "locale" = CASE
    WHEN LOWER(COALESCE("country", '')) LIKE '%pakistan%'
      OR UPPER(COALESCE("currency", '')) = 'PKR'
      OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
    THEN 'en-PK'
    WHEN LOWER(COALESCE("country", '')) IN ('united kingdom', 'uk', 'great britain', 'britain')
      OR UPPER(COALESCE("currency", '')) = 'GBP'
      OR LOWER(COALESCE("timezone", '')) = 'europe/london'
    THEN 'en-GB'
    ELSE "locale"
  END,
  "countryCode" = CASE
    WHEN LOWER(COALESCE("country", '')) LIKE '%pakistan%'
      OR UPPER(COALESCE("currency", '')) = 'PKR'
      OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
    THEN '+92'
    WHEN LOWER(COALESCE("country", '')) IN ('united kingdom', 'uk', 'great britain', 'britain')
      OR UPPER(COALESCE("currency", '')) = 'GBP'
      OR LOWER(COALESCE("timezone", '')) = 'europe/london'
    THEN '+44'
    ELSE "countryCode"
  END,
  "pricingProfile" = CASE
    WHEN LOWER(COALESCE("country", '')) LIKE '%pakistan%'
      OR UPPER(COALESCE("currency", '')) = 'PKR'
      OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
    THEN 'voice_pk_pkr'
    WHEN LOWER(COALESCE("country", '')) IN ('united kingdom', 'uk', 'great britain', 'britain')
      OR UPPER(COALESCE("currency", '')) = 'GBP'
      OR LOWER(COALESCE("timezone", '')) = 'europe/london'
    THEN 'voice_uk_gbp'
    ELSE "pricingProfile"
  END,
  "complianceProfile" = CASE
    WHEN LOWER(COALESCE("country", '')) LIKE '%pakistan%'
      OR UPPER(COALESCE("currency", '')) = 'PKR'
      OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
    THEN 'pk_standard_voice'
    WHEN LOWER(COALESCE("country", '')) IN ('united kingdom', 'uk', 'great britain', 'britain')
      OR UPPER(COALESCE("currency", '')) = 'GBP'
      OR LOWER(COALESCE("timezone", '')) = 'europe/london'
    THEN 'uk_standard_voice'
    ELSE "complianceProfile"
  END,
  "marketRequiresReview" = CASE
    WHEN (
      LOWER(COALESCE("country", '')) LIKE '%pakistan%'
      OR UPPER(COALESCE("currency", '')) = 'PKR'
      OR LOWER(COALESCE("timezone", '')) = 'asia/karachi'
      OR LOWER(COALESCE("country", '')) IN ('united kingdom', 'uk', 'great britain', 'britain')
      OR UPPER(COALESCE("currency", '')) = 'GBP'
      OR LOWER(COALESCE("timezone", '')) = 'europe/london'
    )
    THEN false
    ELSE true
  END;

UPDATE "OnboardingState" os
SET "selectedMarketKey" = org."marketKey"
FROM "Organization" org
WHERE org."id" = os."organizationId"
  AND org."marketKey" IS NOT NULL;
