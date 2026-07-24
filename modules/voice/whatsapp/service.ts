import "server-only";

import { prisma } from "@/lib/prisma";
import { decryptIntegrationCredentials } from "@/lib/integrations";
import { hashToken } from "@/lib/security/tokens";

type MetaWhatsappMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
        messages?: MetaWhatsappMessage[];
        statuses?: Array<{
          id?: string;
          status?: string;
          timestamp?: string;
          recipient_id?: string;
        }>;
      };
    }>;
  }>;
};

const FALLBACK_MESSAGE =
  "Thanks for your message. I have shared this with the team and someone will confirm the exact details soon.";

function parseTimestamp(value?: string) {
  if (!value) return new Date();
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function detectLanguage(text: string) {
  if (/[\u0600-\u06FF]/.test(text)) return "URDU";
  const romanUrduWords = ["kya", "hai", "kar", "bata", "chahiye", "order", "booking", "kitna", "kab", "khula"];
  const normalized = normalizeText(text);
  return romanUrduWords.some((word) => normalized.includes(word)) ? "ROMAN_URDU" : "ENGLISH";
}

function detectIntent(text: string) {
  const normalized = normalizeText(text);
  if (["human", "staff", "agent", "call back", "callback", "insan", "banday", "representative"].some((word) => normalized.includes(word))) {
    return "HANDOFF";
  }
  if (["book", "booking", "appointment", "reservation", "table", "slot"].some((word) => normalized.includes(word))) {
    return "APPOINTMENT";
  }
  if (["order", "takeaway", "delivery", "pickup", "menu"].some((word) => normalized.includes(word))) {
    return "ORDER";
  }
  if (["hour", "timing", "open", "close", "kab", "khula", "وقت"].some((word) => normalized.includes(word))) {
    return "HOURS";
  }
  return "GENERAL";
}

function extractMessageText(message: MetaWhatsappMessage) {
  return (
    message.text?.body ||
    message.button?.text ||
    message.interactive?.button_reply?.title ||
    message.interactive?.list_reply?.title ||
    ""
  ).trim();
}

export function getWhatsappEnvStatus() {
  return {
    webhookUrl: process.env.VOICE_PUBLIC_APP_URL
      ? `${process.env.VOICE_PUBLIC_APP_URL.replace(/\/$/, "")}/api/voice/whatsapp/webhook`
      : null,
    sendEnabled: process.env.VOICE_WHATSAPP_SEND_ENABLED === "true",
    appSecretConfigured: !!process.env.VOICE_WHATSAPP_APP_SECRET,
  };
}

export async function verifyWhatsappChallenge(params: {
  mode: string | null;
  token: string | null;
  challenge: string | null;
}) {
  if (params.mode !== "subscribe" || !params.token || !params.challenge) {
    return null;
  }

  const expectedEnvToken = process.env.VOICE_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (expectedEnvToken && params.token === expectedEnvToken) {
    return params.challenge;
  }

  const tokenHash = hashToken(params.token);
  const integration = await prisma.voiceWhatsappIntegration.findFirst({
    where: { webhookVerifyTokenHash: tokenHash },
    select: { id: true },
  });

  return integration ? params.challenge : null;
}

async function buildWhatsappReply(params: {
  organizationId: string;
  voiceAgentId?: string | null;
  messageText: string;
  contactWaId: string;
  contactName?: string | null;
}) {
  const [profile, settings, knowledgeItems, serviceItems, bookingRules, orderRules] = await Promise.all([
    prisma.voiceBusinessProfile.findUnique({ where: { organizationId: params.organizationId } }),
    prisma.voiceReceptionistSettings.findUnique({ where: { organizationId: params.organizationId } }),
    prisma.voiceKnowledgeBaseItem.findMany({
      where: { organizationId: params.organizationId, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.voiceServiceItem.findMany({
      where: { organizationId: params.organizationId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.voiceBookingRules.findUnique({ where: { organizationId: params.organizationId } }),
    prisma.voiceOrderRules.findUnique({ where: { organizationId: params.organizationId } }),
  ]);

  const businessName = profile?.businessName || "this business";
  const language = detectLanguage(params.messageText);
  const intent = detectIntent(params.messageText);
  const normalized = normalizeText(params.messageText);
  const matchedFaq = knowledgeItems.find((item) => normalizeText(item.question).split(" ").some((word) => word.length > 3 && normalized.includes(word)));
  const matchedService = serviceItems.find((item) => normalized.includes(normalizeText(item.name)));

  let reply = "";
  if (matchedFaq) {
    reply = matchedFaq.answer;
  } else if (intent === "HOURS" && (profile?.openingHours || settings?.businessHours)) {
    reply = `${businessName} business hours are: ${profile?.openingHours || settings?.businessHours}.`;
  } else if (intent === "ORDER") {
    if (orderRules?.acceptsOrderRequests) {
      reply = `Sure. Please send your name, phone number, and order details. Our team will confirm availability, exact price, and preparation time.`;
    } else if (matchedService) {
      reply = `${matchedService.name}${matchedService.description ? `: ${matchedService.description}` : ""}. Please share your name and phone number so the team can confirm exact details.`;
    } else {
      reply = `I can collect your order request for ${businessName}. Please send your name, phone number, and what you need. The team will confirm exact availability and price.`;
    }
  } else if (intent === "APPOINTMENT") {
    if (bookingRules?.acceptsBookings) {
      reply = `Sure. Please share your name, preferred date/time, and phone number. The team will confirm the booking.`;
    } else {
      reply = `I can take your appointment request. Please share your name, phone number, and preferred time so the team can confirm.`;
    }
  } else if (intent === "HANDOFF") {
    reply = `No problem. Please share your name and the best contact number. I will ask the team to follow up.`;
  } else {
    reply = profile?.greetingMessage || settings?.greetingMessage || FALLBACK_MESSAGE;
  }

  if (language === "URDU") {
    reply += " اگر آپ کو درست قیمت، دستیابی، یا بکنگ چاہیے تو براہ کرم اپنا نام اور نمبر بھیج دیں، ٹیم تصدیق کر دے گی۔";
  } else if (language === "ROMAN_URDU") {
    reply += " Exact price, availability ya booking confirm karne ke liye apna naam aur number bhej dein, team confirm kar degi.";
  }

  return { reply, intent, language };
}

async function sendWhatsappText(params: {
  integrationId: string;
  phoneNumberId: string;
  to: string;
  body: string;
}) {
  if (process.env.VOICE_WHATSAPP_SEND_ENABLED !== "true") {
    return { sent: false, skippedReason: "VOICE_WHATSAPP_SEND_ENABLED is not true." };
  }

  const integration = await prisma.voiceWhatsappIntegration.findUnique({
    where: { id: params.integrationId },
    select: { accessTokenEncrypted: true, isEnabled: true },
  });

  if (!integration?.isEnabled || !integration.accessTokenEncrypted) {
    return { sent: false, skippedReason: "WhatsApp integration is disabled or token is missing." };
  }

  const credentials = decryptIntegrationCredentials(integration.accessTokenEncrypted);
  const accessToken = typeof credentials.accessToken === "string" ? credentials.accessToken : "";
  if (!accessToken) {
    return { sent: false, skippedReason: "WhatsApp access token is missing." };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${params.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: "text",
      text: { preview_url: false, body: params.body },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { sent: false, skippedReason: JSON.stringify(payload) };
  }

  return { sent: true, providerMessageId: payload.messages?.[0]?.id as string | undefined };
}

export async function processWhatsappWebhookPayload(payload: MetaWebhookPayload) {
  const results: Array<{ phoneNumberId: string | null; status: string; conversationId?: string; error?: string }> = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id || null;
      if (!phoneNumberId) {
        results.push({ phoneNumberId: null, status: "ignored", error: "Missing phone_number_id." });
        continue;
      }

      const integration = await prisma.voiceWhatsappIntegration.findUnique({
        where: { phoneNumberId },
        include: { voiceAgent: { select: { id: true, organizationId: true, voiceBusinessProfileId: true } } },
      });

      if (!integration) {
        results.push({ phoneNumberId, status: "mapping_failed", error: "No tenant integration matches this phone number ID." });
        continue;
      }

      await prisma.voiceWhatsappIntegration.update({
        where: { id: integration.id },
        data: { lastWebhookAt: new Date(), webhookStatus: "VERIFIED", status: integration.isEnabled ? "CONNECTED" : "CONFIGURED" },
      });

      for (const status of value?.statuses || []) {
        await prisma.voiceWhatsappMessage.updateMany({
          where: { providerMessageId: status.id, organizationId: integration.organizationId },
          data: {
            status: (status.status || "STATUS_UPDATE").toUpperCase(),
            deliveredAt: status.status === "delivered" ? parseTimestamp(status.timestamp) : undefined,
            readAt: status.status === "read" ? parseTimestamp(status.timestamp) : undefined,
          },
        });
      }

      for (const message of value?.messages || []) {
        const contact = value?.contacts?.find((item) => item.wa_id === message.from) || value?.contacts?.[0];
        const contactWaId = message.from || contact?.wa_id;
        if (!contactWaId) {
          results.push({ phoneNumberId, status: "ignored", error: "Missing sender WhatsApp ID." });
          continue;
        }

        const messageText = extractMessageText(message);
        const createdAt = parseTimestamp(message.timestamp);
        const conversation = await prisma.voiceWhatsappConversation.upsert({
          where: {
            integrationId_contactWaId: {
              integrationId: integration.id,
              contactWaId,
            },
          },
          update: {
            contactName: contact?.profile?.name || undefined,
            lastMessagePreview: messageText.slice(0, 180),
            lastMessageAt: createdAt,
            lastInboundAt: createdAt,
          },
          create: {
            organizationId: integration.organizationId,
            integrationId: integration.id,
            voiceAgentId: integration.voiceAgentId,
            contactWaId,
            contactName: contact?.profile?.name || null,
            lastMessagePreview: messageText.slice(0, 180),
            lastMessageAt: createdAt,
            lastInboundAt: createdAt,
          },
        });

        await prisma.voiceWhatsappMessage.upsert({
          where: { providerMessageId: message.id || `local-${conversation.id}-${createdAt.getTime()}` },
          update: {},
          create: {
            organizationId: integration.organizationId,
            integrationId: integration.id,
            conversationId: conversation.id,
            providerMessageId: message.id || null,
            direction: "INBOUND",
            messageType: message.type || "text",
            body: messageText || `[${message.type || "message"}]`,
            status: "RECEIVED",
            rawPayloadJson: JSON.stringify(message),
            createdAt,
          },
        });

        const ai = await buildWhatsappReply({
          organizationId: integration.organizationId,
          voiceAgentId: integration.voiceAgentId,
          messageText,
          contactWaId,
          contactName: contact?.profile?.name,
        });

        const requestFlags = {
          handoffRequested: ai.intent === "HANDOFF",
          orderRequested: ai.intent === "ORDER",
          appointmentRequested: ai.intent === "APPOINTMENT",
        };

        if (ai.intent === "HANDOFF" || ai.intent === "ORDER" || ai.intent === "APPOINTMENT") {
          await prisma.voiceLead.create({
            data: {
              organizationId: integration.organizationId,
              voiceAgentId: integration.voiceAgentId,
              name: contact?.profile?.name || null,
              phone: contactWaId,
              reasonForCall: `WhatsApp ${ai.intent.toLowerCase()} request`,
              source: `WHATSAPP_${ai.intent}_REQUEST`,
              appointmentRequested: ai.intent === "APPOINTMENT",
              notes: messageText,
            },
          });
        }

        const sendResult = await sendWhatsappText({
          integrationId: integration.id,
          phoneNumberId,
          to: contactWaId,
          body: ai.reply,
        });

        await prisma.voiceWhatsappMessage.create({
          data: {
            organizationId: integration.organizationId,
            integrationId: integration.id,
            conversationId: conversation.id,
            providerMessageId: sendResult.sent ? sendResult.providerMessageId || null : null,
            direction: "OUTBOUND",
            messageType: "text",
            body: ai.reply,
            status: sendResult.sent ? "SENT" : "DRAFTED_NOT_SENT",
            aiGenerated: true,
            aiIntent: ai.intent,
            errorMessage: sendResult.sent ? null : sendResult.skippedReason,
          },
        });

        await prisma.voiceWhatsappConversation.update({
          where: { id: conversation.id },
          data: {
            ...requestFlags,
            language: ai.language,
            leadCreated: ai.intent === "HANDOFF" || ai.intent === "ORDER" || ai.intent === "APPOINTMENT" ? true : conversation.leadCreated,
            lastMessagePreview: ai.reply.slice(0, 180),
            lastMessageAt: new Date(),
            lastOutboundAt: sendResult.sent ? new Date() : conversation.lastOutboundAt,
          },
        });

        results.push({ phoneNumberId, status: sendResult.sent ? "replied" : "drafted", conversationId: conversation.id });
      }
    }
  }

  return { ok: true, results };
}

export async function getWhatsappTenantOverview(organizationId: string) {
  const [integrations, conversations, messages, openHandoffs] = await Promise.all([
    prisma.voiceWhatsappIntegration.findMany({
      where: { organizationId },
      include: { voiceAgent: { select: { id: true, displayName: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.voiceWhatsappConversation.findMany({
      where: { organizationId },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      take: 25,
    }),
    prisma.voiceWhatsappMessage.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.voiceWhatsappConversation.count({
      where: { organizationId, handoffRequested: true, status: "OPEN" },
    }),
  ]);

  return { integrations, conversations, messages, openHandoffs, envStatus: getWhatsappEnvStatus() };
}

export async function getWhatsappAdminOverview() {
  const [integrations, recentConversations, failedMessages, counts] = await Promise.all([
    prisma.voiceWhatsappIntegration.findMany({
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        voiceAgent: { select: { id: true, displayName: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.voiceWhatsappConversation.findMany({
      include: { organization: { select: { name: true } } },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      take: 25,
    }),
    prisma.voiceWhatsappMessage.findMany({
      where: { status: { in: ["FAILED", "DRAFTED_NOT_SENT"] } },
      include: { organization: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.$transaction([
      prisma.voiceWhatsappIntegration.count(),
      prisma.voiceWhatsappIntegration.count({ where: { isEnabled: true } }),
      prisma.voiceWhatsappConversation.count(),
      prisma.voiceWhatsappMessage.count({ where: { direction: "INBOUND" } }),
    ]),
  ]);

  return {
    integrations,
    recentConversations,
    failedMessages,
    totals: {
      integrations: counts[0],
      enabledIntegrations: counts[1],
      conversations: counts[2],
      inboundMessages: counts[3],
    },
    envStatus: getWhatsappEnvStatus(),
  };
}
