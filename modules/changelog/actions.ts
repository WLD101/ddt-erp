"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * FETCH: Public/Published changelogs only.
 */
export async function getPublishedChangelogs() {
  return prisma.changelog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
}

/**
 * FETCH: All entries for management (Super-Admin).
 */
export async function getChangelogEntries() {
  return prisma.changelog.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * MUTATION: Create new release note.
 */
export async function createChangelogEntry(data: {
  title: string;
  content: string;
  version?: string;
  category: string;
  status: string;
}) {
  const publishedAt = data.status === "PUBLISHED" ? new Date() : null;

  const entry = await prisma.changelog.create({
    data: {
      ...data,
      publishedAt,
    },
  });

  revalidatePath("/changelog");
  revalidatePath("/platform/changelog");
  return entry;
}

/**
 * MUTATION: Update existing entry.
 */
export async function updateChangelogEntry(id: string, data: Partial<{
  title: string;
  content: string;
  version: string;
  category: string;
  status: string;
}>) {
  const existing = await prisma.changelog.findUnique({ where: { id } });
  if (!existing) throw new Error("Entry not found");

  // If status is moving from DRAFT to PUBLISHED, set publishedAt
  let publishedAt = existing.publishedAt;
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    publishedAt = new Date();
  } else if (data.status === "DRAFT") {
    publishedAt = null;
  }

  const entry = await prisma.changelog.update({
    where: { id },
    data: {
      ...data,
      publishedAt,
    },
  });

  revalidatePath("/changelog");
  revalidatePath("/platform/changelog");
  return entry;
}

/**
 * MUTATION: Delete entry.
 */
export async function deleteChangelogEntry(id: string) {
  await prisma.changelog.delete({ where: { id } });
  revalidatePath("/changelog");
  revalidatePath("/platform/changelog");
}
