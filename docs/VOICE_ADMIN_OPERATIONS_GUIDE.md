# Voice Admin Operations Guide

## Platform Overview
WhatsQuery Voice uses a strict separation between Platform Owners (Super Admins) and Business Admins (Tenants).

- **Super Admins** use `/admin/command-center` and `/admin/tenants` to manage the entire platform, provision AI agents, view global costs, and manage packages.
- **Tenants** use `/dashboard` to view their specific calls, leads, reservations, and package usage.

## AI Receptionist Provisioning Workflow
1. Navigate to **Command Center > Manage Tenants**.
2. Click **Manage Tenant** on the desired organization.
3. If no agent exists, click **Create Receptionist Wizard**.
   - Input the internal name and role.
   - Select the optimal Vapi Voice ID (e.g., Jennifer, Paula).
   - The system creates the `VoiceAgent` and a default `VoiceBusinessProfile`.
4. Go to the **AI Receptionist** tab.
5. (Action Pending) Use the agent sync button to push the prompt to Vapi.
6. Retrieve the generated **Vapi Assistant ID** and configure a Phone Number on Vapi dashboard, then link the **Vapi Phone Number ID** back to the agent.
7. Change Forwarding Status to **VERIFIED** once the client confirms their public number forwards to the assigned Vapi number.

## Package Management & Billing
- Packages are managed under `/admin/packages` where `productType = "VOICE"`.
- Voice packages use `featureJson` to store limits (`maxAgents`, `maxMonthlyCalls`, etc.) and Stripe IDs.
- To **manually bill** a client without Stripe:
  1. Go to the Tenant's **Package & Billing** tab.
  2. Select the Voice Package from the dropdown.
  3. Set Subscription Status to **Active**.
  4. Save the override.

## Security
- **Never** expose `VAPI_PRIVATE_API_KEY` in logs or client-side code.
- **Never** run `prisma db push --accept-data-loss` in production.
- Do not grant Tenants access to `/admin` routes.
