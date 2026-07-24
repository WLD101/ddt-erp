-- Tenant-scoped recording, transcription, disclosure, and retention controls.
ALTER TABLE "VoiceReceptionistSettings"
  ADD COLUMN "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recordingDisclosureEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "recordingDisclosureType" TEXT NOT NULL DEFAULT 'verbal',
  ADD COLUMN "recordingDisclosureText" TEXT,
  ADD COLUMN "transcriptionEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recordingRetentionDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "transcriptRetentionDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "allowRecordingPlayback" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "allowTranscriptAccess" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "VoiceCallLog"
  ADD COLUMN "recordingDisclosureStatus" TEXT NOT NULL DEFAULT 'disabled',
  ADD COLUMN "recordingDisclosureType" TEXT,
  ADD COLUMN "recordingDisclosureCompletedAt" TIMESTAMP(3),
  ADD COLUMN "recordingDeletedAt" TIMESTAMP(3),
  ADD COLUMN "transcriptDeletedAt" TIMESTAMP(3),
  ADD COLUMN "privacyPolicySnapshot" TEXT;
