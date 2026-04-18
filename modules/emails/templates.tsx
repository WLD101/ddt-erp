import React from "react";

export interface EmailTemplateData {
  subject: string;
  previewText: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryText?: string;
}

/**
 * A beautiful, high-fidelity responsive email shell using the NexusERP aesthetic.
 */
export function NexusEmailShell({ children, previewText }: { children: React.ReactNode; previewText: string }) {
  return (
    <div style={{
      backgroundColor: "#020617",
      color: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "40px 20px",
      margin: 0,
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "rgba(30, 41, 59, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          padding: "32px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}>
          <div style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#7c3aed",
            borderRadius: "12px",
            color: "white",
            fontWeight: "bold",
            fontSize: "18px",
            letterSpacing: "-0.5px",
          }}>
            NEXUS<span style={{ opacity: 0.8 }}>ERP</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "40px 32px" }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          padding: "32px",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}>
          <p style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Powered by Nexus Intelligence • San Francisco, CA
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard content block for lifecycle emails.
 */
export function StandardLifecycleTemplate(data: EmailTemplateData) {
  return (
    <NexusEmailShell previewText={data.previewText}>
      <h1 style={{
        fontSize: "32px",
        fontWeight: "900",
        letterSpacing: "-1px",
        margin: "0 0 24px 0",
        color: "white",
        lineHeight: "1.1",
      }}>
        {data.title}
      </h1>
      <p style={{
        fontSize: "16px",
        lineHeight: "1.6",
        color: "#cbd5e1",
        margin: "0 0 32px 0",
      }}>
        {data.body}
      </p>

      {data.ctaUrl && data.ctaLabel && (
        <a 
          href={data.ctaUrl}
          style={{
            display: "inline-block",
            backgroundColor: "#7c3aed",
            color: "white",
            padding: "16px 32px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
            boxShadow: "0 10px 20px rgba(124, 58, 237, 0.2)",
          }}
        >
          {data.ctaLabel}
        </a>
      )}

      {data.secondaryText && (
        <p style={{
          marginTop: "40px",
          fontSize: "13px",
          color: "#64748b",
          fontStyle: "italic",
        }}>
          {data.secondaryText}
        </p>
      )}
    </NexusEmailShell>
  );
}

/**
 * Lifecycle Event Catalogue
 */
export const LifecycleTemplates = {
  WELCOME: (name: string) => ({
    subject: `Welcome to the future of ERP, ${name}!`,
    previewText: "Your organization is bootstrapped and ready.",
    title: "Welcome to \nNexus Intelligence",
    body: `Hello ${name}, your professional workspace has been successfully provisioned. We've unlocked the full suite of our Enterprise features for your 14-day trial.`,
    ctaLabel: "Launch Dashboard",
    ctaUrl: "https://nexuserp.com/dashboard",
    secondaryText: "Need a hand? Our engineering team is standing by to help you import your existing data."
  }),
  TRIAL_ENDING: (daysLeft: number) => ({
    subject: "Your trial is ending soon — stay optimized.",
    previewText: `${daysLeft} days remaining in your premium sequence.`,
    title: `${daysLeft} Days Remaining`,
    body: `Your trial period for the Business Pro plan is concluding. To maintain uninterrupted access to your financial reports and automated workflows, choose your plan today.`,
    ctaLabel: "Upgrade to Pro",
    ctaUrl: "https://nexuserp.com/settings/billing",
    secondaryText: "Don't worry, your data is safe. We'll keep your records for 30 days after the trial expires."
  }),
  TRIAL_EXPIRED: () => ({
    subject: "Your access has been paused.",
    previewText: "Your trial period has concluded.",
    title: "Trial Concluded",
    body: "Your 14-day trial of NexusERP has expired. Your data is still securely stored, but active management features have been paused until a subscription is active.",
    ctaLabel: "Resume Access",
    ctaUrl: "https://nexuserp.com/settings/billing"
  }),
  ONBOARDING_REMINDER: (step: string) => ({
    subject: "Quick tip: Complete your setup",
    previewText: "You're just one step away from full visibility.",
    title: "Finish your setup",
    body: `We noticed you haven't finished the ${step} yet. Completing this will unlock deeper insights in your financial overview.`,
    ctaLabel: "Finish Onboarding",
    ctaUrl: "https://nexuserp.com/onboarding"
  })
};
