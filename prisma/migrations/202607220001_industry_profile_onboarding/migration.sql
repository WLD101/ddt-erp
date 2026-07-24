ALTER TABLE "Organization"
ADD COLUMN "industryProfileKey" TEXT;

ALTER TABLE "OnboardingState"
ADD COLUMN "operationalAnswersJson" TEXT,
ADD COLUMN "recommendedProfileKey" TEXT;
