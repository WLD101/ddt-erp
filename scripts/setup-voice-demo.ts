import { PrismaClient } from "@prisma/client";

import { ensureDefaultVoiceAgent } from "../modules/voice/agents/service";

const prisma = new PrismaClient();

const DEMO_FAQS = [
  {
    question: "What are your opening hours?",
    answer: "We are open every day from 9 AM to 10 PM.",
    category: "hours",
  },
  {
    question: "Can I book a table?",
    answer: "I can take your table booking request and the team will confirm availability.",
    category: "booking",
  },
  {
    question: "Do you take takeaway orders?",
    answer: "I can take your takeaway request and pass it to the team for confirmation.",
    category: "takeaway",
  },
  {
    question: "Can I speak to a human?",
    answer: "I can save your details and ask the team to call you back.",
    category: "support",
  },
  {
    question: "Where are you located?",
    answer: "This is a WhatsQuery Demo Cafe profile for demonstration.",
    category: "location",
  },
];

const DEMO_SERVICE_ITEMS = [
  {
    name: "Signature Karak Chai",
    category: "Beverages",
    description: "Classic karak tea for dine-in, takeaway, or delivery requests.",
    pricePlaceholder: "PKR 350",
    availability: "Every day, 9 AM to 10 PM",
    notes: "Popular for takeaway and delivery.",
    takeawayAvailable: true,
    deliveryAvailable: true,
    dineInAvailable: true,
  },
  {
    name: "Chicken Club Sandwich",
    category: "Cafe Food",
    description: "A customer favorite for lunch and evening orders.",
    pricePlaceholder: "PKR 950",
    availability: "Every day, 12 PM to 10 PM",
    notes: "Can be prepared for takeaway or dine-in.",
    takeawayAvailable: true,
    deliveryAvailable: true,
    dineInAvailable: true,
  },
  {
    name: "Family Table Reservation",
    category: "Reservations",
    description: "Table booking request for families or small groups.",
    pricePlaceholder: "",
    availability: "Subject to staff confirmation",
    notes: "Booking request only, not auto-confirmed.",
    takeawayAvailable: false,
    deliveryAvailable: false,
    dineInAvailable: true,
  },
];

function getArgValue(name: string) {
  const arg = process.argv.find((entry) => entry.startsWith(`${name}=`));
  return arg?.split("=").slice(1).join("=") || null;
}

async function main() {
  const orgSelector = getArgValue("--org") || process.env.VOICE_DEMO_ORG || process.env.VOICE_DEMO_ORG_SLUG;

  if (!orgSelector) {
    throw new Error("Pass --org=<organization-slug-or-id> or set VOICE_DEMO_ORG.");
  }

  const organization = await prisma.organization.findFirst({
    where: {
      OR: [{ id: orgSelector }, { slug: orgSelector }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!organization) {
    throw new Error(`Organization not found for selector "${orgSelector}".`);
  }

  const webhookUrl =
    process.env.VAPI_SERVER_URL ||
    (process.env.VOICE_PUBLIC_APP_URL ? `${process.env.VOICE_PUBLIC_APP_URL}/api/voice/vapi/webhook` : null);

  const integrationNotes = [
    "Demo cafe profile for WhatsQuery Voice.",
    "ERP writes disabled for live demo.",
    "Table bookings and takeaway orders are requests only.",
  ].join(" ");

  await prisma.$transaction(async (tx) => {
    await tx.voiceBusinessProfile.upsert({
      where: { organizationId: organization.id },
      update: {
        businessName: "WhatsQuery Demo Cafe",
        industry: "Cafe / Restaurant",
        website: "https://voice.whatsquery.com",
        businessPhone: "+92 300 1234567",
        preferredLanguage: "AUTO_DETECT",
        openingHours: "Monday to Sunday, 9 AM to 10 PM",
        mainGoal: "CAPTURE_LEADS",
        fallbackContactMethod: "Team will call back",
        greetingMessage:
          "Assalam-o-Alaikum, thanks for calling WhatsQuery Demo Cafe. I'm the AI receptionist. How can I help you today?",
      },
      create: {
        organizationId: organization.id,
        businessName: "WhatsQuery Demo Cafe",
        industry: "Cafe / Restaurant",
        website: "https://voice.whatsquery.com",
        businessPhone: "+92 300 1234567",
        preferredLanguage: "AUTO_DETECT",
        openingHours: "Monday to Sunday, 9 AM to 10 PM",
        mainGoal: "CAPTURE_LEADS",
        fallbackContactMethod: "Team will call back",
        greetingMessage:
          "Assalam-o-Alaikum, thanks for calling WhatsQuery Demo Cafe. I'm the AI receptionist. How can I help you today?",
      },
    });

    await tx.voiceReceptionistSettings.upsert({
      where: { organizationId: organization.id },
      update: {
        receptionistName: "WhatsQuery Demo Receptionist",
        greetingMessage:
          "Assalam-o-Alaikum, thanks for calling WhatsQuery Demo Cafe. I'm the AI receptionist. How can I help you today?",
        fallbackMessage: "I'll save this request and the team will confirm it.",
        languageMode: "AUTO_DETECT",
        businessHours: "Monday to Sunday, 9 AM to 10 PM",
        afterHoursBehavior: "TAKE_MESSAGE",
        leadCaptureFields: JSON.stringify(["name", "phone", "reason", "appointment_time"]),
      },
      create: {
        organizationId: organization.id,
        receptionistName: "WhatsQuery Demo Receptionist",
        greetingMessage:
          "Assalam-o-Alaikum, thanks for calling WhatsQuery Demo Cafe. I'm the AI receptionist. How can I help you today?",
        fallbackMessage: "I'll save this request and the team will confirm it.",
        languageMode: "AUTO_DETECT",
        businessHours: "Monday to Sunday, 9 AM to 10 PM",
        afterHoursBehavior: "TAKE_MESSAGE",
        leadCaptureFields: JSON.stringify(["name", "phone", "reason", "appointment_time"]),
      },
    });

    await tx.voiceBusinessTrainingProfile.upsert({
      where: { organizationId: organization.id },
      update: {
        locationCity: "Pakistan Demo Business",
        shortDescription: "A WhatsQuery demo cafe profile used to showcase AI receptionist flows for Pakistani businesses.",
        primaryLanguage: "AUTO_DETECT",
        supportedLanguages: JSON.stringify(["ENGLISH", "URDU", "ROMAN_URDU", "AUTO_DETECT"]),
        tone: "PAKISTANI_POLITE",
        closingMessage: "Thank you for calling. Allah Hafiz.",
      },
      create: {
        organizationId: organization.id,
        locationCity: "Pakistan Demo Business",
        shortDescription: "A WhatsQuery demo cafe profile used to showcase AI receptionist flows for Pakistani businesses.",
        primaryLanguage: "AUTO_DETECT",
        supportedLanguages: JSON.stringify(["ENGLISH", "URDU", "ROMAN_URDU", "AUTO_DETECT"]),
        tone: "PAKISTANI_POLITE",
        closingMessage: "Thank you for calling. Allah Hafiz.",
      },
    });

    await tx.voiceBookingRules.upsert({
      where: { organizationId: organization.id },
      update: {
        acceptsBookings: true,
        bookingType: "TABLE_BOOKING",
        bookingMode: "STAFF_CONFIRMATION_REQUIRED",
        requiredFields: JSON.stringify(["name", "phone", "date", "time", "party_size_or_service_type", "notes"]),
        maxPartySize: 12,
        confirmationMessage: "I can take your table booking request and the team will confirm availability.",
        fallbackMessage: "I have saved your booking request. Our team will call you back to confirm.",
      },
      create: {
        organizationId: organization.id,
        acceptsBookings: true,
        bookingType: "TABLE_BOOKING",
        bookingMode: "STAFF_CONFIRMATION_REQUIRED",
        requiredFields: JSON.stringify(["name", "phone", "date", "time", "party_size_or_service_type", "notes"]),
        maxPartySize: 12,
        confirmationMessage: "I can take your table booking request and the team will confirm availability.",
        fallbackMessage: "I have saved your booking request. Our team will call you back to confirm.",
      },
    });

    await tx.voiceOrderRules.upsert({
      where: { organizationId: organization.id },
      update: {
        acceptsOrderRequests: true,
        orderMode: "STAFF_CONFIRMATION_REQUIRED",
        orderTypes: JSON.stringify(["TAKEAWAY", "DELIVERY", "DINE_IN"]),
        requiredFields: JSON.stringify([
          "name",
          "phone",
          "items",
          "quantities",
          "pickup_or_delivery",
          "preferred_time",
          "delivery_address",
          "notes_or_allergies",
        ]),
        allergyDisclaimer: "Please mention any allergies and our team will review them before confirming the order.",
        confirmationWording: "I can take your takeaway request and pass it to the team for confirmation.",
      },
      create: {
        organizationId: organization.id,
        acceptsOrderRequests: true,
        orderMode: "STAFF_CONFIRMATION_REQUIRED",
        orderTypes: JSON.stringify(["TAKEAWAY", "DELIVERY", "DINE_IN"]),
        requiredFields: JSON.stringify([
          "name",
          "phone",
          "items",
          "quantities",
          "pickup_or_delivery",
          "preferred_time",
          "delivery_address",
          "notes_or_allergies",
        ]),
        allergyDisclaimer: "Please mention any allergies and our team will review them before confirming the order.",
        confirmationWording: "I can take your takeaway request and pass it to the team for confirmation.",
      },
    });

    await tx.voiceHandoffRules.upsert({
      where: { organizationId: organization.id },
      update: {
        fallbackPhone: "+92 300 1234567",
        fallbackEmail: "team@whatsquery.com",
        staffNotificationPlaceholder: "Demo flow only. Team will call the customer back.",
        handoffTriggers: JSON.stringify([
          "ANGRY_CUSTOMER",
          "PRICING_DISPUTE",
          "REFUND",
          "COMPLEX_BOOKING",
          "ORDER_ISSUE",
          "UNKNOWN_ANSWER",
        ]),
      },
      create: {
        organizationId: organization.id,
        fallbackPhone: "+92 300 1234567",
        fallbackEmail: "team@whatsquery.com",
        staffNotificationPlaceholder: "Demo flow only. Team will call the customer back.",
        handoffTriggers: JSON.stringify([
          "ANGRY_CUSTOMER",
          "PRICING_DISPUTE",
          "REFUND",
          "COMPLEX_BOOKING",
          "ORDER_ISSUE",
          "UNKNOWN_ANSWER",
        ]),
      },
    });

    await tx.voiceAllowedActionPolicy.upsert({
      where: { organizationId: organization.id },
      update: {
        allowedActions: JSON.stringify([
          "ANSWER_FAQS",
          "CAPTURE_LEADS",
          "CREATE_CALLBACK_REQUEST",
          "CREATE_TABLE_BOOKING_REQUEST",
          "CREATE_ORDER_REQUEST",
          "SUMMARIZE_CALL",
          "HANDOFF_TO_STAFF",
          "ERP_WRITES_DISABLED_UNLESS_PACKAGE_ALLOWS",
        ]),
        blockedActions: JSON.stringify([
          "TAKE_PAYMENTS",
          "CONFIRM_PAID_ORDERS",
          "ISSUE_REFUNDS",
          "CANCEL_BOOKINGS",
          "CREATE_INVOICES",
          "DELETE_RECORDS",
          "CHANGE_ERP_FINANCIAL_DATA",
          "GIVE_MEDICAL_LEGAL_FINANCIAL_ADVICE",
          "PROMISE_DELIVERY_TIME_WITHOUT_CONFIGURED_RULE",
        ]),
        erpWritesEnabled: false,
        backendAutoConfirmationEnabled: false,
      },
      create: {
        organizationId: organization.id,
        allowedActions: JSON.stringify([
          "ANSWER_FAQS",
          "CAPTURE_LEADS",
          "CREATE_CALLBACK_REQUEST",
          "CREATE_TABLE_BOOKING_REQUEST",
          "CREATE_ORDER_REQUEST",
          "SUMMARIZE_CALL",
          "HANDOFF_TO_STAFF",
          "ERP_WRITES_DISABLED_UNLESS_PACKAGE_ALLOWS",
        ]),
        blockedActions: JSON.stringify([
          "TAKE_PAYMENTS",
          "CONFIRM_PAID_ORDERS",
          "ISSUE_REFUNDS",
          "CANCEL_BOOKINGS",
          "CREATE_INVOICES",
          "DELETE_RECORDS",
          "CHANGE_ERP_FINANCIAL_DATA",
          "GIVE_MEDICAL_LEGAL_FINANCIAL_ADVICE",
          "PROMISE_DELIVERY_TIME_WITHOUT_CONFIGURED_RULE",
        ]),
        erpWritesEnabled: false,
        backendAutoConfirmationEnabled: false,
      },
    });

    for (let index = 0; index < DEMO_SERVICE_ITEMS.length; index += 1) {
      const service = DEMO_SERVICE_ITEMS[index];
      const existing = await tx.voiceServiceItem.findFirst({
        where: {
          organizationId: organization.id,
          name: service.name,
        },
        select: { id: true },
      });

      if (existing) {
        await tx.voiceServiceItem.update({
          where: { id: existing.id },
          data: {
            ...service,
            isActive: true,
            sortOrder: index,
          },
        });
      } else {
        await tx.voiceServiceItem.create({
          data: {
            organizationId: organization.id,
            ...service,
            isActive: true,
            sortOrder: index,
          },
        });
      }
    }

    await tx.voiceIntegrationSettings.upsert({
      where: { organizationId: organization.id },
      update: {
        vapiStatus: process.env.VAPI_PRIVATE_API_KEY ? "CONFIGURED" : "NOT_CONNECTED",
        vapiAssistantId: null,
        vapiAssistantName: null,
        vapiPhoneNumberId: null,
        vapiWebhookUrl: webhookUrl,
        providerConfigNotes: integrationNotes,
      },
      create: {
        organizationId: organization.id,
        vapiStatus: process.env.VAPI_PRIVATE_API_KEY ? "CONFIGURED" : "NOT_CONNECTED",
        twilioStatus: "NOT_CONNECTED",
        googleCalendarStatus: "NOT_CONNECTED",
        whatsappFollowUpStatus: "NOT_CONNECTED",
        vapiAssistantId: null,
        vapiAssistantName: null,
        vapiPhoneNumberId: null,
        vapiWebhookUrl: webhookUrl,
        providerConfigNotes: integrationNotes,
      },
    });

    for (const faq of DEMO_FAQS) {
      const existing = await tx.voiceKnowledgeBaseItem.findFirst({
        where: {
          organizationId: organization.id,
          question: faq.question,
        },
        select: { id: true },
      });

      if (existing) {
        await tx.voiceKnowledgeBaseItem.update({
          where: { id: existing.id },
          data: {
            answer: faq.answer,
            category: faq.category,
            isActive: true,
          },
        });
      } else {
        await tx.voiceKnowledgeBaseItem.create({
          data: {
            organizationId: organization.id,
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            isActive: true,
          },
        });
      }
    }
  });

  const voiceAgent = await ensureDefaultVoiceAgent(organization.id);

  console.log(
    JSON.stringify(
      {
        success: true,
        organizationId: organization.id,
        organizationSlug: organization.slug,
        businessProfile: "ready",
        receptionistSettings: "ready",
        trainingProfile: "ready",
        bookingRules: "ready",
        orderRules: "ready",
        handoffRules: "ready",
        actionPolicy: "ready",
        serviceItems: DEMO_SERVICE_ITEMS.length,
        demoFaqs: DEMO_FAQS.length,
        voiceAgentId: voiceAgent.id,
        voiceAgentName: voiceAgent.name,
        vapiAssistantIdConfigured: Boolean(voiceAgent.vapiAssistantId),
        vapiPhoneNumberConfigured: Boolean(voiceAgent.vapiPhoneNumberId),
        webhookUrlConfigured: webhookUrl || null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("[setup-voice-demo] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
