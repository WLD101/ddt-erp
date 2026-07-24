"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { requestOtp, verifyOtp } from "@/modules/otp/service";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  businessName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(80).optional(),
  businessType: z.string().trim().max(80).optional(),
  companySize: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.string().trim().min(1).max(40),
  preferredDemoTime: z.string().trim().max(120).optional(),
  honeypot: z.string().optional(),
});

const demoRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(5).max(40),
  organizationName: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
});

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
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const input = parsed.data;

  // Anti-spam check: If honeypot is filled, silently ignore (it's a bot)
  if (input.honeypot) {
    console.warn("[Anti-Spam] Bot submission detected and blocked via honeypot.");
    return { success: true, message: "Thank you for your submission." };
  }

  const limit = await checkRateLimit(rateLimitKey("lead", input.email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { error: "Too many submissions. Please try again later." };
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        businessName: input.businessName,
        phone: input.phone,
        country: input.country,
        businessType: input.businessType,
        companySize: input.companySize,
        message: input.message,
        source: input.source,
        preferredDemoTime: input.preferredDemoTime,
        status: "NEW",
      },
    });

    console.log(`[Lead Capture] New lead from ${data.source}: ${lead.id}`);
    
    // Future: Trigger internal notification or autoresponder here

    return { success: true, message: "Thank you! Our team will reach out shortly." };
  } catch (error) {
    console.error("[Lead Capture Error]", error);
    return { error: "Failed to submit request. Please try again later." };
  }
}

export async function requestDemoOtpAction(data: unknown) {
  const parsed = demoRequestSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const input = parsed.data;
  const limit = await checkRateLimit(rateLimitKey("demo", input.email), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return { error: "Too many demo requests. Please try again later." };

  const existingLead = await prisma.lead.findFirst({
    where: { email: input.email.toLowerCase(), source: "DEMO", demoStatus: { in: ["UNVERIFIED", "VERIFIED_PENDING"] } },
    orderBy: { createdAt: "desc" },
  });
  const lead = existingLead
    ? await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: input.name,
          phone: input.phone,
          businessName: input.organizationName,
          organizationName: input.organizationName,
          city: input.city,
          country: input.country,
          source: "DEMO",
          demoStatus: "UNVERIFIED",
          status: "NEW",
        },
      })
    : await prisma.lead.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone,
          businessName: input.organizationName,
          organizationName: input.organizationName,
          city: input.city,
          country: input.country,
          source: "DEMO",
          demoStatus: "UNVERIFIED",
          status: "NEW",
        },
      });

  const otpRequest = await requestOtp({
    email: input.email,
    purpose: "DEMO_SIGNUP",
    payload: { leadId: lead.id },
  });
  if (!otpRequest.ok) {
    return { error: otpRequest.error || "Unable to send verification code right now." };
  }
  await writePlatformAuditLog({
    action: "OTP_SENT",
    entityType: "DemoRequest",
    entityId: lead.id,
    details: `Demo OTP sent to ${input.email.toLowerCase()}.`,
  });
  return { success: true, leadId: lead.id };
}

export async function verifyDemoOtpAction(data: unknown) {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().min(4).max(10),
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: "Email and OTP are required." };

  const verified = await verifyOtp({
    email: parsed.data.email,
    purpose: "DEMO_SIGNUP",
    code: parsed.data.code,
  });
  if (!verified.ok) return { error: verified.error };

  const payload = verified.payload as { leadId?: string } | null;
  if (!payload?.leadId) return { error: "Demo request expired. Please submit again." };

  const lead = await prisma.lead.update({
    where: { id: payload.leadId },
    data: {
      demoStatus: "VERIFIED_PENDING",
      verifiedAt: new Date(),
      status: "QUALIFIED",
    },
  });

  await writePlatformAuditLog({
    action: "OTP_VERIFIED",
    entityType: "DemoRequest",
    entityId: lead.id,
    details: `Demo request verified for ${lead.email}.`,
  });

  return { success: true, status: "verified_pending" };
}

/**
 * ADMIN: Retrieves all leads for the platform operator.
 */
export async function getPlatformLeads() {
  await requirePlatformAdmin();
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * ADMIN: Retrieves a single lead by ID.
 */
export async function getLeadById(id: string) {
    await requirePlatformAdmin();
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
  await requirePlatformAdmin();
  const updated = await prisma.lead.update({
    where: { id },
    data
  });
  
  revalidatePath("/platform/leads");
  return updated;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueOrgSlug(name: string) {
  const base = slugify(name) || "demo";
  let candidate = base;
  let index = 1;
  while (await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

export async function approveDemoRequestAction(leadId: string) {
  const session = await requirePlatformAdmin();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.demoStatus !== "VERIFIED_PENDING") {
    return { error: "Demo request is not ready for approval." };
  }

  const tempPassword = crypto.randomBytes(12).toString("base64url");
  const hashedPassword = await bcrypt.hash(tempPassword, 12);
  const now = new Date();
  const demoExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const orgName = lead.organizationName || lead.businessName || `${lead.name}'s Organization`;
  const slug = await uniqueOrgSlug(orgName);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: lead.email.toLowerCase() },
      update: {
        name: lead.name,
        phone: lead.phone,
        password: hashedPassword,
        authStatus: "verified",
        verifiedAt: lead.verifiedAt ?? now,
        emailVerified: lead.verifiedAt ?? now,
        isDemoUser: true,
      },
      create: {
        name: lead.name,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        password: hashedPassword,
        authStatus: "verified",
        verifiedAt: lead.verifiedAt ?? now,
        emailVerified: lead.verifiedAt ?? now,
        isDemoUser: true,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        city: lead.city,
        country: lead.country,
        isDemoTenant: true,
        lifecycleStatus: "active",
        accessStatus: "active",
        activatedAt: now,
        demoExpiresAt,
        subscription: {
          create: {
            planId: "demo",
            status: "active",
            paymentStatus: "active",
            accessStatus: "active",
            currentPeriodStart: now,
            currentPeriodEnd: demoExpiresAt,
            activatedAt: now,
          },
        },
      },
    });

    const {
      seedPermissions,
      initializeTenantRoles,
      initializeTenantBranches,
      initializeTenantFinances,
    } = await import("@/lib/security/seed");
    await seedPermissions();
    await initializeTenantRoles(organization.id);
    await initializeTenantBranches(organization.id);
    await initializeTenantFinances(organization.id);

    const ownerRole = await tx.role.findUnique({
      where: { name_organizationId: { name: "owner", organizationId: organization.id } },
    });
    if (!ownerRole) throw new Error("Failed to initialize demo owner role.");

    await tx.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        roleId: ownerRole.id,
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        demoStatus: "ACTIVATED",
        status: "WON",
        approvedAt: now,
        activatedOrganizationId: organization.id,
      },
    });

    return { user, organization };
  });

  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "DEMO_APPROVED",
    entityType: "Lead",
    entityId: lead.id,
    details: `Demo approved. Temporary password generated for ${lead.email}.`,
  });

  revalidatePath("/platform/leads");
  revalidatePath("/platform/tenants");
  return { success: true, organizationId: result.organization.id };
}

export async function rejectDemoRequestAction(leadId: string) {
  const session = await requirePlatformAdmin();
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      demoStatus: "REJECTED",
      status: "LOST",
      rejectedAt: new Date(),
    },
  });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "DEMO_REJECTED",
    entityType: "Lead",
    entityId: lead.id,
    details: `Demo rejected for ${lead.email}.`,
  });
  revalidatePath("/platform/leads");
  return { success: true };
}

export async function createManualLeadAction(data: unknown) {
  const session = await requirePlatformAdmin();
  const schema = demoRequestSchema.extend({ notes: z.string().max(2000).optional() });
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      businessName: input.organizationName,
      organizationName: input.organizationName,
      city: input.city,
      country: input.country,
      notes: input.notes,
      source: "MANUAL",
      status: "NEW",
      demoStatus: "NONE",
    },
  });
  await writePlatformAuditLog({
    actorId: session.user.id,
    action: "LEAD_CREATED",
    entityType: "Lead",
    entityId: lead.id,
    details: "Manual lead created.",
  });
  revalidatePath("/platform/leads");
  return { success: true, data: lead };
}
