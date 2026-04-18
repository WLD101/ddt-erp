"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * PUBLIC: Submits a new lead from contact or demo forms.
 */
export async function submitLeadAction(data: {
  name: string;
  email: string;
  businessName?: string;
  phone?: string;
  country?: string;
  businessType?: string;
  companySize?: string;
  message?: string;
  source: string;
  preferredDemoTime?: string;
  honeypot?: string; // Anti-spam field
}) {
  // Anti-spam check: If honeypot is filled, silently ignore (it's a bot)
  if (data.honeypot) {
    console.warn("[Anti-Spam] Bot submission detected and blocked via honeypot.");
    return { success: true, message: "Thank you for your submission." };
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        businessName: data.businessName,
        phone: data.phone,
        country: data.country,
        businessType: data.businessType,
        companySize: data.companySize,
        message: data.message,
        source: data.source,
        preferredDemoTime: data.preferredDemoTime,
        status: "NEW",
      },
    });

    console.log(`[Lead Capture] New lead from ${data.source}: ${lead.id}`);
    
    // Future: Trigger internal notification or autoresponder here

    return { success: true, message: "Thank you! Our team will reach out shortly." };
  } catch (error: any) {
    console.error("[Lead Capture Error]", error);
    return { error: "Failed to submit request. Please try again later." };
  }
}

/**
 * ADMIN: Retrieves all leads for the platform operator.
 */
export async function getPlatformLeads() {
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * ADMIN: Retrieves a single lead by ID.
 */
export async function getLeadById(id: string) {
    return prisma.lead.findUnique({
        where: { id }
    });
}

/**
 * ADMIN: Updates the status or assignee of a lead.
 */
export async function updateLeadAction(
    id: string, 
    data: { status?: string; assignedToId?: string }
) {
  const updated = await prisma.lead.update({
    where: { id },
    data
  });
  
  revalidatePath("/platform/leads");
  return updated;
}
