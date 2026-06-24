"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { revalidatePath } from "next/cache";

export async function getKnowledgeBases() {
  await requirePlatformAdmin();
  return prisma.knowledgeBase.findMany({
    include: {
      _count: {
        select: { documents: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createKnowledgeBase(data: { name: string; description?: string }) {
  await requirePlatformAdmin();
  const kb = await prisma.knowledgeBase.create({
    data: {
      name: data.name,
      description: data.description,
      isGlobal: true, // Admin created KBs are global
    },
  });
  revalidatePath("/voice/admin/knowledge");
  return kb;
}

export async function addKnowledgeDocument(kbId: string, data: { title: string; content: string }) {
  await requirePlatformAdmin();
  const doc = await prisma.knowledgeDocument.create({
    data: {
      knowledgeBaseId: kbId,
      title: data.title,
      content: data.content,
      type: "FAQ", // default
      isGlobal: true,
    },
  });
  revalidatePath(`/voice/admin/knowledge/${kbId}`);
  return doc;
}

export async function getKnowledgeBaseDetails(id: string) {
  await requirePlatformAdmin();
  return prisma.knowledgeBase.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
}
