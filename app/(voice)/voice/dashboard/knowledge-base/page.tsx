import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { VoiceKnowledgeBaseManager } from "@/components/voice/voice-knowledge-base-manager";
import { getVoiceWorkspace } from "@/modules/voice/service";

export default async function VoiceKnowledgeBasePage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const workspace = await getVoiceWorkspace(ctx.organizationId);

  return (
    <VoiceKnowledgeBaseManager
      items={workspace.knowledgeBaseItems.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.category,
        isActive: item.isActive,
      }))}
    />
  );
}
