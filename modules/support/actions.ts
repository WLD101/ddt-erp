"use server";

import { z } from "zod";
import { createServerAction } from "@/lib/actions/builder";
import { writeAuditLog } from "@/lib/audit";

export const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(10, "Please provide more details on your issue"),
});

export const submitSupportTicket = createServerAction({
  label: "Submit Support Ticket",
  schema: supportTicketSchema,
  // Accessible to all authenticated tenant users
  handler: async ({ input, context }) => {
    // Note: Instead of building a dedicated tickets DB table right now,
    // we seamlessly log the internal help-request functionally into the Audit Ledger
    // which the administrative team will query independently.
    
    await writeAuditLog(
      context.ctx,
      "SUPPORT_TICKET_OPENED",
      "System",
      `ticket-${Date.now()}`,
      `[${input.category.toUpperCase()}] ${input.subject} - ${input.description}`
    );

    // In a production application, you would also trigger an external email service 
    // here (e.g., SendGrid, Postmark) or a Slack webhook for live support.
    
    return true;
  },
});
