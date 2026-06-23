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
  const template = await prisma.agentTemplate.create({
    data: {
      name: data.name,
      industry: data.industry,
      role: data.role,
      description: data.description,
      systemPrompt: data.systemPrompt,
      firstMessage: data.firstMessage,
      toolsConfig: data.toolsConfig ? JSON.stringify(data.toolsConfig) : undefined,
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
  const template = await prisma.agentTemplate.update({
    where: { id },
    data,
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
