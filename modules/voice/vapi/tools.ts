// modules/voice/vapi/tools.ts

import { prisma } from "@/lib/prisma";

export async function handleToolCall(
  toolName: string,
  args: any,
  organizationId: string
): Promise<any> {
  try {
    switch (toolName) {
      case "capture_lead":
        return await captureLead(args, organizationId);
      case "request_appointment":
        return await requestAppointment(args, organizationId);
      case "lookup_faq":
        return await lookupFaq(args, organizationId);
      case "get_business_hours":
        return await getBusinessHours(organizationId);
      case "get_fallback_contact":
        return await getFallbackContact(organizationId);
      case "summarize_call":
        return await summarizeCall(args, organizationId);
      default:
        return { error: `Tool ${toolName} not supported.` };
    }
  } catch (error) {
    console.error(`[Vapi Tools] Error executing ${toolName}:`, error);
    return { error: "An error occurred while executing the tool." };
  }
}

async function captureLead(args: any, organizationId: string) {
  const { name, phone, email, reasonForCall, notes } = args;
  
  if (!name && !phone && !email) {
    return { success: false, error: "At least name, phone, or email is required." };
  }

  const lead = await prisma.voiceLead.create({
    data: {
      organizationId,
      name,
      phone,
      email,
      reasonForCall,
      notes,
      source: "VAPI_CALL",
      status: "NEW",
    },
  });

  return { success: true, leadId: lead.id, message: "Lead captured successfully." };
}

async function requestAppointment(args: any, organizationId: string) {
  const { name, phone, email, reasonForCall, preferredTime } = args;

  const notes = preferredTime ? `Preferred time: ${preferredTime}` : undefined;

  const lead = await prisma.voiceLead.create({
    data: {
      organizationId,
      name,
      phone,
      email,
      reasonForCall,
      notes,
      appointmentRequested: true,
      source: "VAPI_CALL",
      status: "NEW",
    },
  });

  return { 
    success: true, 
    message: "Appointment request recorded. Let the user know the team will review and confirm availability." 
  };
}

async function lookupFaq(args: any, organizationId: string) {
  const { query } = args;
  if (!query) return { error: "Query is required" };

  // Simple substring search for MVP. Advanced implementation would use vector search.
  const items = await prisma.voiceKnowledgeBaseItem.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [
        { question: { contains: query, mode: "insensitive" } },
        { answer: { contains: query, mode: "insensitive" } }
      ]
    },
    take: 3
  });

  if (items.length === 0) {
    return { found: false, message: "No exact answer found in knowledge base." };
  }

  return { 
    found: true, 
    answers: items.map(i => ({ question: i.question, answer: i.answer })) 
  };
}

async function getBusinessHours(organizationId: string) {
  const settings = await prisma.voiceReceptionistSettings.findUnique({
    where: { organizationId }
  });
  
  if (settings?.businessHours) {
    return { businessHours: settings.businessHours };
  }

  const profile = await prisma.voiceBusinessProfile.findUnique({
    where: { organizationId }
  });

  return { 
    businessHours: profile?.openingHours || "Business hours are not explicitly configured." 
  };
}

async function getFallbackContact(organizationId: string) {
  const profile = await prisma.voiceBusinessProfile.findUnique({
    where: { organizationId }
  });

  return {
    fallbackContact: profile?.fallbackContactMethod || profile?.businessPhone || profile?.email || "No fallback contact available."
  };
}

async function summarizeCall(args: any, organizationId: string) {
  // We don't have the Vapi call ID easily here without passing it down.
  // For now, return a success placeholder if the tool is invoked to format the end-of-call report.
  // Real summary updates happen via the end-of-call-report event payload in the webhook.
  return { success: true, message: "Summary noted." };
}
