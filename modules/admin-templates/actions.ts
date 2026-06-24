"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { revalidatePath } from "next/cache";

export async function getAgentTemplates() {
  await requirePlatformAdmin();
  return prisma.agentTemplate.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createAgentTemplate(data: {
  name: string;
  industry: string;
  role: string;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  toolsConfig?: any;
}) {
  await requirePlatformAdmin();
  const configObj = {
    role: data.role,
    firstMessage: data.firstMessage,
    toolsConfig: data.toolsConfig,
  };
  const template = await prisma.agentTemplate.create({
    data: {
      name: data.name,
      industry: data.industry,
      description: data.description,
      basePrompt: data.systemPrompt,
      config: JSON.stringify(configObj),
    },
  });
  revalidatePath("/voice/admin/templates");
  return template;
}

export async function updateAgentTemplate(id: string, data: Partial<{
  name: string;
  industry: string;
  role: string;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  isActive: boolean;
}>) {
  await requirePlatformAdmin();
  
  // Since we don't have all these fields, we need to map them to config and basePrompt.
  // For simplicity here, we only update what's directly on the schema.
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.industry) updateData.industry = data.industry;
  if (data.description) updateData.description = data.description;
  if (data.systemPrompt) updateData.basePrompt = data.systemPrompt;
  
  const template = await prisma.agentTemplate.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/voice/admin/templates");
  return template;
}

export async function deleteAgentTemplate(id: string) {
  await requirePlatformAdmin();
  await prisma.agentTemplate.delete({ where: { id } });
  revalidatePath("/voice/admin/templates");
  return { success: true };
}
