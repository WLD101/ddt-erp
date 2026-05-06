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

export function WhatsQueryEmailShell({ children }: { children: React.ReactNode; previewText: string }) {
  return (
    <div
      style={{
        backgroundColor: "#020617",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "40px 20px",
        margin: 0,
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: "#7c3aed",
              borderRadius: "12px",
              color: "white",
              fontWeight: "bold",
              fontSize: "18px",
              letterSpacing: "-0.5px",
            }}
          >
            WHATS<span style={{ opacity: 0.8 }}>QUERY</span>
          </div>
        </div>

        <div style={{ padding: "40px 32px" }}>{children}</div>

        <div
          style={{
            padding: "32px",
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <p style={{ color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Powered by WhatsQuery Intelligence • Secure lifecycle email
          </p>
        </div>
      </div>
    </div>
  );
}

export function StandardLifecycleTemplate(data: EmailTemplateData) {
  return (
    <WhatsQueryEmailShell previewText={data.previewText}>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "900",
          letterSpacing: "-1px",
          margin: "0 0 24px 0",
          color: "white",
          lineHeight: "1.1",
        }}
      >
        {data.title}
      </h1>
      <p
        style={{
          fontSize: "16px",
          lineHeight: "1.6",
          color: "#cbd5e1",
          margin: "0 0 32px 0",
        }}
      >
        {data.body}
      </p>

      {data.ctaUrl && data.ctaLabel ? (
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
      ) : null}

      {data.secondaryText ? (
        <p
          style={{
            marginTop: "40px",
            fontSize: "13px",
            color: "#64748b",
            fontStyle: "italic",
          }}
        >
          {data.secondaryText}
        </p>
      ) : null}
    </WhatsQueryEmailShell>
  );
}

const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const LifecycleTemplates = {
  WELCOME: (name: string) => ({
    subject: `Welcome to WhatsQuery, ${name}!`,
    previewText: "Your organization is provisioned and ready.",
    title: "Welcome to\nWhatsQuery",
    body: `Hello ${name}, your workspace has been provisioned successfully. Your team can now continue onboarding and activate the package that fits your business.`,
    ctaLabel: "Launch Dashboard",
    ctaUrl: `${appUrl}/dashboard`,
    secondaryText: "Need help importing data or setting up integrations? Start with the guided onboarding flow.",
  }),
  TRIAL_ENDING: (daysLeft: number) => ({
    subject: "Your trial is ending soon.",
    previewText: `${daysLeft} days remaining in your trial.`,
    title: `${daysLeft} Days Remaining`,
    body: "Your trial period is close to ending. Choose a package to keep access to reports, inventory workflows, and ecommerce channels active.",
    ctaLabel: "View Pricing",
    ctaUrl: `${appUrl}/settings/billing`,
    secondaryText: "Your data remains available while you complete billing decisions.",
  }),
  TRIAL_EXPIRED: () => ({
    subject: "Your access has been paused.",
    previewText: "Your trial period has concluded.",
    title: "Trial Concluded",
    body: "Your WhatsQuery trial has expired. Your data is still securely stored, but active management features remain paused until a subscription is active.",
    ctaLabel: "Resume Access",
    ctaUrl: `${appUrl}/settings/billing`,
  }),
  ONBOARDING_REMINDER: (step: string) => ({
    subject: "Complete your setup",
    previewText: "You're one step away from full visibility.",
    title: "Finish your setup",
    body: `We noticed you have not finished the ${step} yet. Completing it will unlock better reporting and cleaner workspace setup.`,
    ctaLabel: "Finish Onboarding",
    ctaUrl: `${appUrl}/onboarding`,
  }),
};
