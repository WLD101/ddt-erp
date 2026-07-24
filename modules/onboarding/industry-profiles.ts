import { z } from "zod";

export const operationalModelKeys = [
  "immediate_order",
  "retail_transaction",
  "future_booking",
  "quote_to_order",
  "manufacturing_order",
  "distribution_order",
  "case_management",
] as const;

export const industryCapabilityKeys = [
  "supports_immediate_orders",
  "supports_future_bookings",
  "supports_reservations",
  "supports_quotes",
  "supports_production",
  "supports_dispatch",
  "supports_delivery",
  "supports_collection",
  "supports_table_service",
  "supports_kitchen_workflow",
  "supports_inventory",
  "supports_ingredients",
  "supports_raw_materials",
  "supports_finished_goods",
  "supports_bom",
  "supports_quality_control",
  "supports_credit_sales",
  "supports_deposits",
  "supports_staff_assignment",
  "supports_capacity_planning",
  "supports_appointment_reminders",
  "supports_order_status_updates",
  "supports_case_management",
] as const;

export const voiceCapabilityKeys = [
  "read_faqs",
  "capture_leads",
  "create_order_request",
  "create_reservation_request",
  "create_appointment_request",
  "send_follow_up_message",
  "handoff_to_staff",
  "approval_required_for_confirmation",
] as const;

export const onboardingQuestionKeys = [
  "business_type",
  "fulfilment_mode",
  "offering_type",
  "requires_quotes",
  "manages_inventory",
  "manages_raw_materials",
  "prepares_before_fulfilment",
  "offers_delivery_or_collection",
  "payment_pattern",
  "resource_assignment",
  "recurring_needs",
  "existing_software",
] as const;

export const recommendationLevels = [
  "ESSENTIAL",
  "RECOMMENDED",
  "OPTIONAL",
  "ADVANCED",
  "NOT_APPLICABLE",
  "COMING_SOON",
] as const;

export type OperationalModelKey = (typeof operationalModelKeys)[number];
export type IndustryCapabilityKey = (typeof industryCapabilityKeys)[number];
export type VoiceCapabilityKey = (typeof voiceCapabilityKeys)[number];
export type OnboardingQuestionKey = (typeof onboardingQuestionKeys)[number];
export type RecommendationLevel = (typeof recommendationLevels)[number];

export const industryProfileKeySchema = z.enum([
  "retail",
  "wholesale",
  "ecommerce",
  "distribution",
  "manufacturing",
  "service_basic",
  "textile",
  "restaurant_voice",
  "clinic_voice",
]);

export type IndustryProfileKey = z.infer<typeof industryProfileKeySchema>;

export const onboardingOperationalAnswersSchema = z.object({
  businessType: z.enum(["retail", "wholesale", "ecommerce", "distribution", "manufacturing", "service", "other"]).default("retail"),
  fulfilmentMode: z.enum(["immediate", "future", "both"]).default("immediate"),
  offeringType: z.enum(["products", "services", "manufactured_goods", "mixed"]).default("products"),
  requiresQuotes: z.boolean().default(false),
  managesInventory: z.boolean().default(true),
  managesRawMaterials: z.boolean().default(false),
  preparesBeforeFulfilment: z.boolean().default(false),
  offersDeliveryOrCollection: z.enum(["none", "collection", "delivery", "both"]).default("none"),
  paymentPattern: z.enum(["immediate", "deposit", "invoice"]).default("immediate"),
  resourceAssignment: z.array(z.enum(["staff", "branches", "machines", "rooms", "vehicles"])).default([]),
  recurringNeeds: z.boolean().default(false),
  existingSoftware: z.array(z.string().trim().min(1)).default([]),
});

export type OnboardingOperationalAnswers = z.infer<typeof onboardingOperationalAnswersSchema>;

export type IndustryIntegrationRecommendation = {
  key: string;
  label: string;
  level: RecommendationLevel;
  reason: string;
};

export type IndustryProfile = {
  key: IndustryProfileKey;
  name: string;
  status: "active" | "beta" | "planned" | "hidden";
  evidenceTier: "high" | "medium" | "low";
  operationalModels: OperationalModelKey[];
  capabilities: IndustryCapabilityKey[];
  enabledModules: { id: string; label: string; description: string }[];
  terminology: Record<string, string>;
  workflowTemplates: string[];
  voiceCapabilities: VoiceCapabilityKey[];
  recommendedIntegrations: IndustryIntegrationRecommendation[];
  onboardingQuestions: OnboardingQuestionKey[];
};

function integrationsFor(
  entries: Array<[string, string, RecommendationLevel, string]>
): IndustryIntegrationRecommendation[] {
  return entries.map(([key, label, level, reason]) => ({ key, label, level, reason }));
}

const sharedQuestions = onboardingQuestionKeys;

export const INDUSTRY_PROFILES: Record<IndustryProfileKey, IndustryProfile> = {
  retail: {
    key: "retail",
    name: "Retail",
    status: "active",
    evidenceTier: "high",
    operationalModels: ["retail_transaction"],
    capabilities: [
      "supports_inventory",
      "supports_collection",
      "supports_order_status_updates",
    ],
    enabledModules: [
      { id: "inventory_mgmt", label: "Inventory Management", description: "Real-time stock tracking and alerts." },
      { id: "sales_reports", label: "Sales Reports", description: "Daily sales and profit analytics." },
      { id: "customer_mgmt", label: "Customer Management", description: "CRM and loyalty tracking." },
      { id: "supplier_mgmt", label: "Supplier Management", description: "Purchase orders and vendor bills." },
    ],
    terminology: {
      primary_transaction: "Sale",
      fulfilment: "Checkout",
      resource: "Register",
      item: "Product",
      customer_request: "Purchase",
    },
    workflowTemplates: ["retail_transaction_v1"],
    voiceCapabilities: ["read_faqs", "capture_leads", "handoff_to_staff"],
    recommendedIntegrations: integrationsFor([
      ["stripe", "Stripe", "ESSENTIAL", "Recommended for checkout and online payments."],
      ["google_sheets", "Google Sheets", "RECOMMENDED", "Useful for catalog and reporting exports."],
      ["webhooks", "Webhooks", "RECOMMENDED", "Useful for downstream stock and sales automations."],
      ["whatsapp_business", "WhatsApp Business", "OPTIONAL", "Helpful for customer follow-up and order updates."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  wholesale: {
    key: "wholesale",
    name: "Wholesale / Trading",
    status: "active",
    evidenceTier: "high",
    operationalModels: ["quote_to_order", "distribution_order", "case_management"],
    capabilities: [
      "supports_quotes",
      "supports_inventory",
      "supports_credit_sales",
      "supports_dispatch",
      "supports_case_management",
      "supports_order_status_updates",
    ],
    enabledModules: [
      { id: "bulk_pricing", label: "Bulk Pricing", description: "Tiered pricing for large orders." },
      { id: "purchases", label: "Purchases", description: "Record supplier bills and inward stock." },
      { id: "inventory_mgmt", label: "Inventory Management", description: "Track stock levels and reorder signals." },
      { id: "reports", label: "Business Reports", description: "Monitor sales, profit, and outstanding balances." },
    ],
    terminology: {
      primary_transaction: "Sales order",
      fulfilment: "Dispatch",
      resource: "Warehouse",
      item: "Stock item",
      customer_request: "Order enquiry",
    },
    workflowTemplates: ["wholesale_order_v1"],
    voiceCapabilities: ["read_faqs", "capture_leads", "send_follow_up_message", "handoff_to_staff"],
    recommendedIntegrations: integrationsFor([
      ["hubspot", "HubSpot", "ESSENTIAL", "CRM is highly relevant for quote, follow-up, and account workflows."],
      ["outlook_email", "Outlook Email", "ESSENTIAL", "Useful for quotation and account communication."],
      ["google_sheets", "Google Sheets", "ESSENTIAL", "Useful for price lists and import/export operations."],
      ["whatsapp_business", "WhatsApp Business", "RECOMMENDED", "Helpful for account updates and collections follow-up."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  ecommerce: {
    key: "ecommerce",
    name: "Ecommerce",
    status: "active",
    evidenceTier: "high",
    operationalModels: ["retail_transaction", "distribution_order"],
    capabilities: [
      "supports_inventory",
      "supports_delivery",
      "supports_order_status_updates",
    ],
    enabledModules: [
      { id: "channel_sync", label: "Channel Sync", description: "Sync products, orders, and stock with connected stores." },
      { id: "csv_import", label: "CSV / Excel Import", description: "Import catalogues and orders without API access." },
      { id: "inventory_mgmt", label: "Inventory Management", description: "Prevent stock mismatch across online channels." },
      { id: "reports", label: "Channel Reports", description: "Track revenue and orders by ecommerce channel." },
    ],
    terminology: {
      primary_transaction: "Order",
      fulfilment: "Delivery",
      resource: "Warehouse",
      item: "Product",
      customer_request: "Online order",
    },
    workflowTemplates: ["ecommerce_order_v1"],
    voiceCapabilities: ["read_faqs", "capture_leads", "handoff_to_staff"],
    recommendedIntegrations: integrationsFor([
      ["shopify", "Shopify", "ESSENTIAL", "Direct evidence exists for channel synchronization."],
      ["woocommerce", "WooCommerce", "ESSENTIAL", "Useful for storefront sync and order imports."],
      ["daraz", "Daraz", "RECOMMENDED", "Useful when marketplace fulfillment is active."],
      ["stripe", "Stripe", "RECOMMENDED", "Useful for direct web checkout."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  distribution: {
    key: "distribution",
    name: "Distribution",
    status: "beta",
    evidenceTier: "medium",
    operationalModels: ["distribution_order", "case_management"],
    capabilities: [
      "supports_inventory",
      "supports_dispatch",
      "supports_credit_sales",
      "supports_case_management",
    ],
    enabledModules: [
      { id: "branches", label: "Branches", description: "Manage stock across hubs and sales locations." },
      { id: "inventory_mgmt", label: "Inventory Management", description: "Track dispatch-ready stock by branch." },
      { id: "purchases", label: "Purchases", description: "Receive supplier stock into branch inventory." },
      { id: "reports", label: "Operational Reports", description: "Review movement, low stock, and branch activity." },
    ],
    terminology: {
      primary_transaction: "Distribution order",
      fulfilment: "Dispatch",
      resource: "Branch hub",
      item: "Stock item",
      customer_request: "Order",
    },
    workflowTemplates: ["distribution_order_v1"],
    voiceCapabilities: ["capture_leads", "send_follow_up_message", "handoff_to_staff"],
    recommendedIntegrations: integrationsFor([
      ["webhooks", "Webhooks", "ESSENTIAL", "Useful for downstream distribution automations."],
      ["google_sheets", "Google Sheets", "RECOMMENDED", "Useful for dispatch planning and imports."],
      ["whatsapp_business", "WhatsApp Business", "RECOMMENDED", "Helpful for dispatch communication."],
      ["zapier", "Zapier", "OPTIONAL", "Useful for lightweight routing automations."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  manufacturing: {
    key: "manufacturing",
    name: "Manufacturing",
    status: "beta",
    evidenceTier: "medium",
    operationalModels: ["manufacturing_order", "quote_to_order"],
    capabilities: [
      "supports_quotes",
      "supports_production",
      "supports_inventory",
      "supports_raw_materials",
      "supports_finished_goods",
      "supports_bom",
      "supports_quality_control",
      "supports_staff_assignment",
      "supports_capacity_planning",
    ],
    enabledModules: [
      { id: "products", label: "Products", description: "Manage finished goods and production-ready SKUs." },
      { id: "inventory", label: "Inventory", description: "Track raw materials and finished stock levels." },
      { id: "purchases", label: "Purchases", description: "Receive materials and supplier bills for production." },
      { id: "sales", label: "Sales", description: "Create customer invoices for manufactured goods." },
      { id: "production", label: "Production", description: "Use production workflows for work orders and output tracking." },
    ],
    terminology: {
      primary_transaction: "Production order",
      fulfilment: "Production",
      resource: "Machine or team",
      item: "Material or finished good",
      customer_request: "Enquiry",
    },
    workflowTemplates: ["manufacturing_order_v1"],
    voiceCapabilities: ["read_faqs", "capture_leads", "send_follow_up_message", "handoff_to_staff", "approval_required_for_confirmation"],
    recommendedIntegrations: integrationsFor([
      ["outlook_email", "Outlook Email", "ESSENTIAL", "Useful for buyer communication and approvals."],
      ["google_sheets", "Google Sheets", "ESSENTIAL", "Useful for planning and data exchange."],
      ["universal_rest", "Universal REST API", "ADVANCED", "Useful for plant and planning integrations later."],
      ["webhooks", "Webhooks", "RECOMMENDED", "Useful for production events and downstream automations."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  service_basic: {
    key: "service_basic",
    name: "Service Basic",
    status: "active",
    evidenceTier: "medium",
    operationalModels: ["future_booking", "quote_to_order", "case_management"],
    capabilities: [
      "supports_quotes",
      "supports_deposits",
      "supports_staff_assignment",
      "supports_appointment_reminders",
      "supports_case_management",
    ],
    enabledModules: [
      { id: "sales_invoices", label: "Sales Invoices", description: "Create invoices for basic service billing." },
      { id: "customers", label: "Customer Management", description: "Manage client records and contact details." },
      { id: "expenses", label: "Expenses", description: "Track service delivery costs and overhead." },
      { id: "reports", label: "Basic Reports", description: "Review invoices, payments, and expenses." },
    ],
    terminology: {
      primary_transaction: "Booking",
      fulfilment: "Service delivery",
      resource: "Staff member",
      item: "Service",
      customer_request: "Appointment request",
    },
    workflowTemplates: ["service_booking_v1"],
    voiceCapabilities: ["read_faqs", "capture_leads", "create_appointment_request", "send_follow_up_message", "handoff_to_staff"],
    recommendedIntegrations: integrationsFor([
      ["google_calendar", "Google Calendar", "ESSENTIAL", "Future bookings and appointments need schedule visibility."],
      ["outlook_calendar", "Outlook Calendar", "ESSENTIAL", "Useful for teams already using Microsoft scheduling."],
      ["stripe", "Stripe", "RECOMMENDED", "Useful for deposits and invoice collection."],
      ["whatsapp_business", "WhatsApp Business", "RECOMMENDED", "Useful for reminders and follow-up."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  textile: {
    key: "textile",
    name: "Textile",
    status: "planned",
    evidenceTier: "low",
    operationalModels: ["manufacturing_order", "quote_to_order"],
    capabilities: [
      "supports_quotes",
      "supports_production",
      "supports_raw_materials",
      "supports_quality_control",
    ],
    enabledModules: [
      { id: "products", label: "Products", description: "Track textile SKUs and buyer-facing products." },
      { id: "inventory", label: "Inventory", description: "Track yarn, fabric, and finished stock." },
      { id: "production", label: "Production", description: "Reserved for future textile workflow activation." },
    ],
    terminology: {
      primary_transaction: "Buyer enquiry",
      fulfilment: "Production and dispatch",
      resource: "Batch or line",
      item: "Fabric or specification",
      customer_request: "Specification request",
    },
    workflowTemplates: ["textile_order_v1"],
    voiceCapabilities: ["capture_leads", "send_follow_up_message", "handoff_to_staff", "approval_required_for_confirmation"],
    recommendedIntegrations: integrationsFor([
      ["google_sheets", "Google Sheets", "ESSENTIAL", "Useful for exchanging buyer specifications."],
      ["outlook_email", "Outlook Email", "ESSENTIAL", "Useful for buyer communication."],
      ["webhooks", "Webhooks", "COMING_SOON", "Recommended once textile operational workflows are active."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  restaurant_voice: {
    key: "restaurant_voice",
    name: "Restaurant / Cafe Voice",
    status: "beta",
    evidenceTier: "medium",
    operationalModels: ["immediate_order", "future_booking", "case_management"],
    capabilities: [
      "supports_immediate_orders",
      "supports_future_bookings",
      "supports_reservations",
      "supports_delivery",
      "supports_collection",
      "supports_table_service",
      "supports_kitchen_workflow",
      "supports_order_status_updates",
      "supports_case_management",
    ],
    enabledModules: [
      { id: "voice_receptionist", label: "Voice Receptionist", description: "Capture reservations, orders, and follow-up calls." },
      { id: "reservation_queue", label: "Reservation Queue", description: "Store requests for human confirmation." },
      { id: "order_queue", label: "Order Queue", description: "Store takeaway and delivery requests." },
    ],
    terminology: {
      primary_transaction: "Order",
      fulfilment: "Preparation",
      resource: "Kitchen or staff",
      item: "Menu item",
      customer_request: "Reservation or order",
    },
    workflowTemplates: ["restaurant_order_request_v1", "reservation_request_v1"],
    voiceCapabilities: [
      "read_faqs",
      "capture_leads",
      "create_order_request",
      "create_reservation_request",
      "send_follow_up_message",
      "handoff_to_staff",
      "approval_required_for_confirmation",
    ],
    recommendedIntegrations: integrationsFor([
      ["whatsapp_business", "WhatsApp Business", "ESSENTIAL", "Useful for reservation and order follow-up."],
      ["twilio_sms", "Twilio SMS", "ESSENTIAL", "Useful for confirmations and short updates."],
      ["stripe", "Stripe", "RECOMMENDED", "Useful when deposits or payment links are needed."],
      ["google_calendar", "Google Calendar", "OPTIONAL", "Useful when table reservations require calendar coordination."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
  clinic_voice: {
    key: "clinic_voice",
    name: "Clinic / Dental Clinic Voice",
    status: "beta",
    evidenceTier: "medium",
    operationalModels: ["future_booking", "case_management"],
    capabilities: [
      "supports_future_bookings",
      "supports_staff_assignment",
      "supports_capacity_planning",
      "supports_appointment_reminders",
      "supports_case_management",
    ],
    enabledModules: [
      { id: "voice_receptionist", label: "Voice Receptionist", description: "Capture appointment requests and callbacks." },
      { id: "appointment_queue", label: "Appointment Queue", description: "Store appointment requests for verification." },
      { id: "callbacks", label: "Callback Queue", description: "Route sensitive cases back to staff." },
    ],
    terminology: {
      primary_transaction: "Appointment",
      fulfilment: "Visit",
      resource: "Clinician",
      item: "Service",
      customer_request: "Patient enquiry",
    },
    workflowTemplates: ["clinic_appointment_request_v1"],
    voiceCapabilities: [
      "read_faqs",
      "capture_leads",
      "create_appointment_request",
      "send_follow_up_message",
      "handoff_to_staff",
      "approval_required_for_confirmation",
    ],
    recommendedIntegrations: integrationsFor([
      ["google_calendar", "Google Calendar", "ESSENTIAL", "Future appointments require schedule visibility."],
      ["outlook_calendar", "Outlook Calendar", "ESSENTIAL", "Useful for Microsoft-based scheduling."],
      ["twilio_sms", "Twilio SMS", "RECOMMENDED", "Useful for appointment reminders."],
      ["outlook_email", "Outlook Email", "RECOMMENDED", "Useful for patient communication where appropriate."],
    ]),
    onboardingQuestions: [...sharedQuestions],
  },
};

export function getIndustryProfile(profileKey: IndustryProfileKey) {
  return INDUSTRY_PROFILES[profileKey];
}

export function getIndustryProfileKeysByStatus(status: IndustryProfile["status"]) {
  return Object.values(INDUSTRY_PROFILES)
    .filter((profile) => profile.status === status)
    .map((profile) => profile.key);
}

export function getDefaultEnabledModuleIds(profileKey: IndustryProfileKey) {
  return INDUSTRY_PROFILES[profileKey].enabledModules.map((module) => module.id);
}

export function resolveIndustryProfileFromLegacyIndustry(industry: string | null | undefined): IndustryProfileKey | null {
  if (!industry) return null;

  if (industry in INDUSTRY_PROFILES) {
    return industry as IndustryProfileKey;
  }

  switch (industry) {
    case "retail":
      return "retail";
    case "wholesale":
      return "wholesale";
    case "ecommerce":
      return "ecommerce";
    case "distribution":
      return "distribution";
    case "manufacturing":
      return "manufacturing";
    case "service_basic":
    case "service":
      return "service_basic";
    case "textile":
      return "textile";
    case "restaurant":
    case "cafe":
      return "restaurant_voice";
    case "clinic":
    case "dental_clinic":
      return "clinic_voice";
    default:
      return null;
  }
}

export function resolveIndustryProfileRecommendation(
  selectedIndustry: IndustryProfileKey | null | undefined,
  answers: OnboardingOperationalAnswers
) {
  const scores = new Map<IndustryProfileKey, number>();

  for (const key of Object.keys(INDUSTRY_PROFILES) as IndustryProfileKey[]) {
    scores.set(key, 0);
  }

  const add = (key: IndustryProfileKey, score: number) => {
    scores.set(key, (scores.get(key) || 0) + score);
  };

  const selected = selectedIndustry && INDUSTRY_PROFILES[selectedIndustry] ? selectedIndustry : null;
  if (selected) add(selected, 5);

  switch (answers.businessType) {
    case "retail":
      add("retail", 6);
      break;
    case "wholesale":
      add("wholesale", 6);
      add("distribution", 2);
      break;
    case "ecommerce":
      add("ecommerce", 6);
      break;
    case "distribution":
      add("distribution", 6);
      add("wholesale", 2);
      break;
    case "manufacturing":
      add("manufacturing", 6);
      add("textile", 1);
      break;
    case "service":
      add("service_basic", 6);
      add("clinic_voice", 1);
      break;
  }

  if (answers.fulfilmentMode === "immediate") {
    add("retail", 2);
    add("restaurant_voice", 4);
  } else if (answers.fulfilmentMode === "future") {
    add("service_basic", 2);
    add("clinic_voice", 4);
    add("manufacturing", 2);
  } else {
    add("restaurant_voice", 4);
    add("service_basic", 2);
  }

  if (answers.offeringType === "manufactured_goods") {
    add("manufacturing", 5);
    add("textile", 2);
  } else if (answers.offeringType === "services") {
    add("service_basic", 4);
    add("clinic_voice", 2);
  } else if (answers.offeringType === "products") {
    add("retail", 2);
    add("wholesale", 2);
    add("ecommerce", 2);
  }

  if (answers.requiresQuotes) {
    add("wholesale", 3);
    add("manufacturing", 3);
    add("service_basic", 2);
  }

  if (answers.managesInventory) {
    add("retail", 2);
    add("wholesale", 2);
    add("ecommerce", 2);
    add("distribution", 2);
    add("manufacturing", 2);
  }

  if (answers.managesRawMaterials || answers.preparesBeforeFulfilment) {
    add("manufacturing", 4);
    add("textile", 2);
    add("restaurant_voice", 2);
  }

  if (answers.offersDeliveryOrCollection === "collection" || answers.offersDeliveryOrCollection === "both") {
    add("restaurant_voice", 2);
    add("retail", 1);
  }
  if (answers.offersDeliveryOrCollection === "delivery" || answers.offersDeliveryOrCollection === "both") {
    add("ecommerce", 2);
    add("distribution", 2);
    add("restaurant_voice", 2);
  }

  if (answers.paymentPattern === "invoice") {
    add("wholesale", 3);
    add("manufacturing", 2);
  } else if (answers.paymentPattern === "deposit") {
    add("service_basic", 2);
    add("restaurant_voice", 1);
  }

  if (answers.resourceAssignment.includes("machines")) {
    add("manufacturing", 4);
    add("textile", 2);
  }
  if (answers.resourceAssignment.includes("rooms")) {
    add("clinic_voice", 2);
    add("service_basic", 1);
  }
  if (answers.resourceAssignment.includes("vehicles")) {
    add("distribution", 1);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [profileKey, confidenceScore] = ranked[0];
  const recommendedProfile = INDUSTRY_PROFILES[profileKey];

  return {
    profileKey,
    confidenceScore,
    recommendedProfile,
    summary: {
      operationalModels: recommendedProfile.operationalModels,
      capabilities: recommendedProfile.capabilities,
      recommendedIntegrations: recommendedProfile.recommendedIntegrations,
    },
  };
}
