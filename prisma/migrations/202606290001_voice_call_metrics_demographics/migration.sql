ALTER TABLE "VoiceCallLog"
ADD COLUMN "callerCountry" TEXT,
ADD COLUMN "callerRegion" TEXT,
ADD COLUMN "callerCity" TEXT,
ADD COLUMN "callerTimezone" TEXT,
ADD COLUMN "callerNumberCountryCode" TEXT,
ADD COLUMN "usageMetricsSource" TEXT;

CREATE INDEX "VoiceCallLog_callerCountry_idx" ON "VoiceCallLog"("callerCountry");
CREATE INDEX "VoiceCallLog_callerNumberCountryCode_idx" ON "VoiceCallLog"("callerNumberCountryCode");
