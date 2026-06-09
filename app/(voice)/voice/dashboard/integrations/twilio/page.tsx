import { getCurrentTenantContext, requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { saveTwilioSettingsAction } from "@/modules/voice/actions";
import { revalidatePath } from "next/cache";

export default async function TwilioSetupPage() {
  const ctx = await getCurrentTenantContext();
  requireRole(ctx, "owner", "admin");
  const organizationId = ctx.organizationId;

  const settings = await prisma.voiceIntegrationSettings.findUnique({
    where: { organizationId },
  });

  let twilioConfig = {
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  };

  if (settings?.providerConfigNotes) {
    try {
      twilioConfig = JSON.parse(settings.providerConfigNotes);
    } catch {
      // Ignored if invalid JSON
    }
  }

  // Handle form submission via server action
  async function handleSaveTwilio(formData: FormData) {
    "use server";
    const accountSid = formData.get("accountSid") as string;
    const authToken = formData.get("authToken") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    await saveTwilioSettingsAction({
      accountSid,
      authToken,
      phoneNumber,
      twilioStatus: "CONNECTED",
    });

    revalidatePath("/voice/dashboard/integrations/twilio");
    revalidatePath("/voice/dashboard/integrations");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface">Twilio Integration</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Connect your Twilio account to route calls using custom Pakistani or international numbers.</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Pakistani Phone Numbers Support</div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
          Twilio allows you to purchase or bring your own phone numbers (including Pakistani mobile and landline numbers). By connecting Twilio as the telephony carrier backend, WhatsQuery can answer calls, qualify leads, and synchronize transactions instantly while utilizing your local phone line.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-8 shadow-soft">
          <h2 className="mb-6 text-lg font-black text-on-surface tracking-tight">Configure Credentials</h2>
          <form action={handleSaveTwilio} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Twilio Account SID</label>
              <input
                type="text"
                name="accountSid"
                defaultValue={twilioConfig.accountSid}
                required
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Twilio Auth Token</label>
              <input
                type="password"
                name="authToken"
                defaultValue={twilioConfig.authToken}
                required
                placeholder="••••••••••••••••••••••••••••••••"
                className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Twilio Phone Number (with Country Code)</label>
              <input
                type="text"
                name="phoneNumber"
                defaultValue={twilioConfig.phoneNumber}
                required
                placeholder="+923001234567"
                className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container px-3 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-[10px] font-black uppercase tracking-wider text-on-primary shadow-md hover:bg-primary/95 transition-all"
            >
              Save Configuration
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-black text-on-surface">Setup Checklist</h2>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li className="flex items-center justify-between">
                <span>Account SID Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${twilioConfig.accountSid ? "bg-emerald-500/10 text-emerald-700" : "bg-outline-variant text-on-surface-variant"}`}>
                  {twilioConfig.accountSid ? "Configured" : "Missing"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Auth Token Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${twilioConfig.authToken ? "bg-emerald-500/10 text-emerald-700" : "bg-outline-variant text-on-surface-variant"}`}>
                  {twilioConfig.authToken ? "Configured" : "Missing"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Active Phone Number</span>
                <span className="font-semibold text-on-surface">{twilioConfig.phoneNumber || "Not assigned"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Carrier Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${settings?.twilioStatus === "CONNECTED" ? "bg-emerald-500/10 text-emerald-700" : "bg-outline-variant text-on-surface-variant"}`}>
                  {settings?.twilioStatus || "NOT_CONNECTED"}
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-black text-on-surface">Twilio Incoming Webhook URL</h2>
            <p className="text-xs text-on-surface-variant mb-3">Copy this webhook URL and paste it into your Twilio Console for the active phone number under "A Call Comes In" section:</p>
            <code className="block rounded bg-surface-container-low p-3 text-xs text-primary font-mono break-all select-all">
              {process.env.VOICE_PUBLIC_APP_URL ? `${process.env.VOICE_PUBLIC_APP_URL}/api/voice/twilio/webhook` : "Configure VOICE_PUBLIC_APP_URL"}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
