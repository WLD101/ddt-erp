-- AlterTable
ALTER TABLE "VoiceCallLog" ADD COLUMN "provider" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "providerCallId" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "providerPhoneNumberId" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "providerAssistantId" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "endedReason" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "transcript" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "messagesJson" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "rawEventJson" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "recordingUrl" TEXT;
ALTER TABLE "VoiceCallLog" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "VoiceCallLog" ADD COLUMN "endedAt" TIMESTAMP(3);
