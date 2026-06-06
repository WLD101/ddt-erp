# Voice Client Onboarding Checklist

## 1. Pre-Onboarding (Admin Actions)
- [ ] Create the Organization (Tenant) in the platform.
- [ ] Assign a Voice Package to the Tenant via `/admin/tenants/[id]`.
- [ ] Provide Tenant with their login credentials for `/dashboard`.

## 2. Agent Provisioning (Admin Actions)
- [ ] Navigate to `/admin/tenants/[id]/wizard`.
- [ ] Input Business Profile data and select Voice Role.
- [ ] Create the AI Receptionist.
- [ ] Sync the AI Prompt to Vapi via the Admin Panel.
- [ ] Acquire a phone number in the Vapi dashboard.
- [ ] Link the Vapi Phone Number ID to the `VoiceAgent`.

## 3. Client Onboarding (Tenant Actions)
- [ ] Tenant logs into `/dashboard`.
- [ ] Tenant inputs Operating Hours, Services, and custom Greeting Message.
- [ ] Tenant inputs FAQs in the Knowledge Base.
- [ ] Tenant verifies WhatsApp notification number in Settings.

## 4. Go-Live
- [ ] Super Admin sets Call Forwarding Status to VERIFIED.
- [ ] Make a test call to the assigned AI number.
- [ ] Verify the call log appears in the Tenant's dashboard.
- [ ] Verify no errors in `/admin/command-center`.
