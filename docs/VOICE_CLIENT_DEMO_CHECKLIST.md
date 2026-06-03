# WhatsQuery Voice Client Demo Checklist

This checklist is for the WhatsQuery Voice AI Receptionist foundation demo only.

## What this demo is meant to prove

- The voice product is separate from ERP assistant workflows.
- A business can configure an AI receptionist profile.
- Calls can be routed through a provider webhook into tenant-scoped Voice data.
- Booking requests, order requests, lead capture, and callback requests are saved safely.
- Call logs, summaries, and transcripts can be surfaced in the dashboard when the provider sends them.

## What this demo does not promise yet

- Live ERP writes
- Confirmed bookings
- Confirmed takeaway preparation
- Payment collection
- Invoice creation
- Google Calendar booking sync
- Twilio, WhatsApp, or other external follow-up automation

## URLs to have ready

- Landing page: `https://voice.whatsquery.com/`
- Login: `https://voice.whatsquery.com/login`
- Command center: `https://voice.whatsquery.com/dashboard/command-center`
- Vapi integration: `https://voice.whatsquery.com/dashboard/integrations/vapi`
- Call logs: `https://voice.whatsquery.com/dashboard/call-logs`
- Leads: `https://voice.whatsquery.com/dashboard/leads`
- Reservations: `https://voice.whatsquery.com/dashboard/reservations`
- Orders: `https://voice.whatsquery.com/dashboard/orders`

## Phone number to call

- Add the live Vapi demo number here once assigned.
- Do not share an unverified number with clients.

## Demo business profile

- Business name: `WhatsQuery Demo Cafe`
- Industry: `Cafe / Restaurant`
- Hours: `Every day, 9 AM to 10 PM`
- Greeting: `Thanks for calling WhatsQuery Demo Cafe. I'm the AI receptionist. How can I help today?`
- Fallback: `The team will call you back to confirm.`

## Recommended demo script

### Call 1: Table booking request

Caller says:

`Hi, I want to book a table.`

Expected receptionist behavior:

- asks for caller name
- asks for phone number
- asks for party size
- asks for date and time
- says the team will confirm availability

Show after the call:

- `Call Logs`
- `Reservations`
- `Leads`

### Call 2: Opening hours / FAQ

Caller says:

`What time are you open?`

Expected receptionist behavior:

- answers from configured business hours or active FAQ

Show after the call:

- `Call Logs`
- latest webhook / provider status in `Command Center`

### Call 3: Takeaway request

Caller says:

`I want to order two burgers for pickup.`

Expected receptionist behavior:

- asks for name
- asks for phone number
- asks for order items and quantities
- asks for pickup time
- says the team will confirm details before preparing it

Show after the call:

- `Call Logs`
- `Orders`
- `Leads`

### Call 4: Human callback

Caller says:

`I want someone from the team to call me back.`

Expected receptionist behavior:

- captures name and phone
- captures the reason
- says the team will follow up directly

Show after the call:

- `Leads`
- `Call Logs`

## What to say during the meeting

- `WhatsQuery Voice is a separate AI receptionist product, not just an ERP voice command panel.`
- `It answers calls, uses business knowledge, captures requests, and keeps everything tenant-scoped in the dashboard.`
- `Bookings and takeaway requests are intentionally saved as requests first, so nothing is falsely confirmed.`
- `ERP writes are still disabled in this phase, which protects live operations during rollout.`

## What not to promise

- Do not say bookings are auto-confirmed.
- Do not say orders go directly into ERP.
- Do not say payments are handled.
- Do not say WhatsApp, Twilio, or Google Calendar are live unless verified later.

## Before every client demo

- Confirm `VOICE_CALLING_ENABLED=true` only after provider mapping is verified.
- Confirm `VOICE_ERP_WRITE_ENABLED=false`
- Confirm `VOICE_RESTAURANT_WORKFLOWS_ENABLED=false`
- Confirm the Vapi assistant ID and phone number ID are mapped to the correct tenant.
- Confirm the latest webhook timestamp is updating.
- Make one private test call before the client meeting.

## Next phase after this demo

- Provider-backed transcript validation
- Real inbound call QA across multiple tenants
- Calendar-backed booking confirmation
- Optional ERP automation for approved reservations or takeaway handoff
- Safe outbound callback workflows
