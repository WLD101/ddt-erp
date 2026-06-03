import { PrismaClient } from "@prisma/client";

import { ensureDefaultVoiceAgent } from "../modules/voice/agents/service";
import { fetchAssistantDetails, getVapiEnvStatus } from "../modules/voice/vapi/service";
import { getVoiceTrainingWorkspace } from "../modules/voice/training/service";

const prisma = new PrismaClient();

function getArgValue(name: string) {
  const arg = process.argv.find((entry) => entry.startsWith(`${name}=`));
  return arg?.split("=").slice(1).join("=") || null;
}

async function main() {
  const orgSelector = getArgValue("--org") || process.env.VOICE_DEMO_ORG || process.env.VOICE_DEMO_ORG_SLUG;
  const status = getVapiEnvStatus();

  const organization = orgSelector
    ? await prisma.organization.findFirst({
        where: { OR: [{ id: orgSelector }, { slug: orgSelector }] },
        select: { id: true, slug: true, name: true },
      })
    : null;

  const integration = organization
    ? await prisma.voiceIntegrationSettings.findUnique({
        where: { organizationId: organization.id },
      })
    : null;
  const voiceAgent = organization ? await ensureDefaultVoiceAgent(organization.id) : null;
  const training = organization ? await getVoiceTrainingWorkspace(organization.id, { voiceAgentId: voiceAgent?.id || null }) : null;

  const assistantDetails =
    voiceAgent?.vapiAssistantId && status.hasPrivateKey
      ? await fetchAssistantDetails(voiceAgent.vapiAssistantId)
      : null;

  console.log(JSON.stringify({
    env: {
      hasPrivateKey: status.hasPrivateKey,
      hasPublicKey: status.hasPublicKey,
      hasWebhookSecret: status.hasWebhookSecret,
      callingEnabled: status.callingEnabled,
      webhookUrl: status.webhookUrl || null,
    },
    organization: organization
      ? {
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
        }
      : null,
    integration: integration
      ? {
          vapiStatus: integration.vapiStatus,
          vapiWebhookUrl: integration.vapiWebhookUrl,
          lastWebhookAt: integration.lastWebhookAt,
          lastWebhookType: integration.lastWebhookType,
        }
      : null,
    voiceAgent: voiceAgent
      ? {
          id: voiceAgent.id,
          name: voiceAgent.name,
          role: voiceAgent.role,
          assistantId: voiceAgent.vapiAssistantId,
          assistantName: voiceAgent.vapiAssistantName,
          phoneNumberId: voiceAgent.vapiPhoneNumberId,
          isDefault: voiceAgent.isDefault,
          isActive: voiceAgent.isActive,
          lastPromptSyncedAt: voiceAgent.lastPromptSyncedAt,
        }
      : null,
    training:
      training
        ? {
            checklist: training.setupChecklist,
            servicesCount: training.serviceItems.length,
            activeFaqs: training.knowledgeBaseItems.filter((item) => item.isActive).length,
            lastPromptSyncedAt: training.runtime.vapiMapping.lastPromptSyncedAt,
            assistantMapped: !!training.voiceAgent?.vapiAssistantId,
            phoneMapped: !!training.voiceAgent?.vapiPhoneNumberId,
          }
        : null,
    assistant: assistantDetails
      ? {
          id: assistantDetails.id ?? voiceAgent?.vapiAssistantId,
          name: assistantDetails.name ?? null,
          serverUrl: assistantDetails.server?.url ?? assistantDetails.serverUrl ?? null,
          firstMessage: assistantDetails.firstMessage ?? null,
          modelProvider: assistantDetails.model?.provider ?? null,
        }
      : null,
    nextSteps:
      voiceAgent?.vapiPhoneNumberId
        ? []
        : [
            "No Vapi phone number ID is mapped to the default voice agent yet.",
            "Open Vapi Dashboard -> Phone Numbers.",
            "Create or rent a phone number.",
            "Assign it to the WhatsQuery Demo Cafe Receptionist assistant.",
            "Store that phone number ID on the default VoiceAgent mapping.",
            "Set the server URL to the webhook shown above.",
            "Set the webhook secret if configured.",
          ],
  }, null, 2));
}

main()
  .catch((error) => {
    console.error("[verify-vapi-demo] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
