import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceSettingsForm } from "@/components/voice/voice-settings-form";
import { getVoiceSettingsData, getVoiceWorkspace } from "@/modules/voice/service";

export default async function VoiceSettingsPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const [{ receptionistSettings, leadCaptureFields }, workspace] = await Promise.all([
    getVoiceSettingsData(ctx.organizationId),
    getVoiceWorkspace(ctx.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <VoiceSettingsForm
        initialValues={{
          receptionistName: receptionistSettings?.receptionistName ?? "WhatsQuery Receptionist",
          greetingMessage:
            receptionistSettings?.greetingMessage ??
            workspace.businessProfile?.greetingMessage ??
            "Thanks for calling. How can I help you today?",
          fallbackMessage:
            receptionistSettings?.fallbackMessage ??
            "Thanks for reaching out. We are unavailable right now, but our team will follow up soon.",
          languageMode:
            (receptionistSettings?.languageMode as
              | "ENGLISH"
              | "URDU"
              | "ROMAN_URDU"
              | "ROMAN_ENGLISH"
              | "MIXED_ROMAN_URDU_ENGLISH"
              | "AUTO_DETECT"
              | undefined) ??
            (workspace.businessProfile?.preferredLanguage as
              | "ENGLISH"
              | "URDU"
              | "ROMAN_URDU"
              | "ROMAN_ENGLISH"
              | "MIXED_ROMAN_URDU_ENGLISH"
              | "AUTO_DETECT"
              | undefined) ??
            "ENGLISH",
          businessHours: receptionistSettings?.businessHours ?? workspace.businessProfile?.openingHours ?? "",
          afterHoursBehavior:
            (receptionistSettings?.afterHoursBehavior as "TAKE_MESSAGE" | "TEXT_FALLBACK" | "VOICEMAIL" | "ESCALATE" | undefined) ??
            "TAKE_MESSAGE",
          leadCaptureFields: leadCaptureFields as Array<"name" | "phone" | "email" | "reason" | "appointment_time">,
        }}
      />
    </div>
  );
}
