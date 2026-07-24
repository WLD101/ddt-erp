import { prisma } from "../lib/prisma";
import { getVapiPrivateApiKey, getVapiEnvStatus } from "../modules/voice/vapi/service";

async function fetchCollection(pathname: string) {
  const apiKey = getVapiPrivateApiKey();
  if (!apiKey) return { reachable: false, records: [] as Record<string, any>[] };
  const response = await fetch(`https://api.vapi.ai${pathname}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    return { reachable: response.status !== 401, records: [] as Record<string, any>[] };
  }
  const body = await response.json();
  return {
    reachable: true,
    records: (Array.isArray(body) ? body : body?.results || []) as Record<string, any>[],
  };
}

function serverUrlOf(record: Record<string, any>) {
  return record.server?.url || record.serverUrl || null;
}

async function main() {
  const env = getVapiEnvStatus();
  const [assistants, phoneNumbers, localAgents] = await Promise.all([
    fetchCollection("/assistant?limit=1000"),
    fetchCollection("/phone-number?limit=1000"),
    prisma.voiceAgent.findMany({
      where: { isActive: true },
      select: {
        vapiAssistantId: true,
        vapiPhoneNumberId: true,
        organizationId: true,
      },
    }),
  ]);

  const assistantIds = new Set(assistants.records.map((record) => record.id).filter(Boolean));
  const phoneNumberIds = new Set(phoneNumbers.records.map((record) => record.id).filter(Boolean));
  const mappedAssistantIds = new Set(localAgents.map((agent) => agent.vapiAssistantId).filter(Boolean));
  const mappedPhoneNumberIds = new Set(localAgents.map((agent) => agent.vapiPhoneNumberId).filter(Boolean));
  const expectedWebhook = env.webhookUrl;
  const organizationIds = new Set(
    [...assistants.records, ...phoneNumbers.records]
      .map((record) => record.orgId)
      .filter(Boolean),
  );
  const configuredServerUrls = [
    ...assistants.records.map(serverUrlOf),
    ...phoneNumbers.records.map(serverUrlOf),
  ].filter(Boolean);

  const duplicateAssistantMappings = localAgents.length - new Set(
    localAgents.filter((agent) => agent.vapiAssistantId).map((agent) => agent.vapiAssistantId),
  ).size - localAgents.filter((agent) => !agent.vapiAssistantId).length;
  const duplicatePhoneMappings = localAgents.length - new Set(
    localAgents.filter((agent) => agent.vapiPhoneNumberId).map((agent) => agent.vapiPhoneNumberId),
  ).size - localAgents.filter((agent) => !agent.vapiPhoneNumberId).length;

  console.log(JSON.stringify({
    vapiApiReachable: assistants.reachable && phoneNumbers.reachable,
    connectedAccountIdentityVerified: organizationIds.size === 1,
    assistantsDiscovered: assistants.records.length,
    phoneNumbersDiscovered: phoneNumbers.records.length,
    serverUrlsVerified: expectedWebhook
      ? configuredServerUrls.filter((url) => url === expectedWebhook).length
      : 0,
    unknownAssistants: [...assistantIds].filter((id) => !mappedAssistantIds.has(id)).length,
    unknownPhoneNumbers: [...phoneNumberIds].filter((id) => !mappedPhoneNumberIds.has(id)).length,
    mappedAssistants: [...mappedAssistantIds].filter((id) => assistantIds.has(id)).length,
    mappedPhoneNumbers: [...mappedPhoneNumberIds].filter((id) => phoneNumberIds.has(id)).length,
    duplicateTenantMappings: Math.max(0, duplicateAssistantMappings) + Math.max(0, duplicatePhoneMappings),
    webhookSecretConfigured: env.hasWebhookSecret,
    privateApiKeyConfigured: env.hasPrivateKey,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Vapi connection diagnostic failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
