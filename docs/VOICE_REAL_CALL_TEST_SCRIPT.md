# WhatsQuery Voice - Real Call Test Script

Use this script to test the WhatsQuery Voice AI Receptionist after deploying and mapping a Vapi phone number.

## Pre-requisites
1. A WhatsQuery Voice tenant is fully onboarded.
2. The Vapi integration is configured and the "Sync to Vapi" button was clicked.
3. A real phone number is mapped to the Vapi Assistant.

## Test 1: General Inquiry & FAQ
**Objective:** Test the AI's ability to answer questions using the Knowledge Base.

**Call Flow:**
- **You:** Call the number.
- **AI:** (Should play the configured Greeting Message).
- **You:** "Hi, I wanted to know what your business hours are?"
- **AI:** (Should read the configured Opening Hours).
- **You:** "Great. Do you guys have parking available?"
- **AI:** (Should answer based on the FAQ Knowledge Base).
- **You:** "Awesome, thanks. That's all I needed."
- **AI:** (Should gracefully end the call).

**Verification:**
- Check the **Call Logs** in the Tenant Dashboard.
- Verify a `VoiceCallLog` exists with a summary of the questions asked.

## Test 2: Order / Takeaway Request
**Objective:** Test the AI's ability to capture an order request and enforce required fields.

**Call Flow:**
- **You:** Call the number.
- **AI:** (Greeting).
- **You:** "Hi, I'd like to place an order for takeaway."
- **AI:** (Should ask what you'd like to order, and prompt for missing fields like Name and Phone).
- **You:** "I want 2 large pizzas and a coke. My name is Ali."
- **AI:** (Should ask for any missing fields e.g., preferred time).
- **You:** "I'll pick it up in 30 minutes. My phone number is 0300-1234567."
- **AI:** (Should confirm the order *request* and explicitly state that staff will review/confirm it, enforcing safety).

**Verification:**
- Check the **Orders** queue in the Tenant Dashboard.
- Verify a `VoiceOrderRequest` exists with "Ali", "0300-1234567", and the items.
- Status should be `needs_staff_review`.

## Test 3: Human Handoff
**Objective:** Test the AI's fallback behavior when a user gets angry or asks an unknown question.

**Call Flow:**
- **You:** Call the number.
- **AI:** (Greeting).
- **You:** "I want a refund right now! Your service is terrible."
- **AI:** (Should trigger the `handoff_to_staff` tool due to the "Angry Customer / Refund" trigger).
- **AI:** (Should collect name/phone and apologize, saying a human will call back).
- **You:** "My name is Bilal and number is 0300-9876543."
- **AI:** (Should confirm callback).

**Verification:**
- Check the **Leads** queue in the Tenant Dashboard.
- Verify a `VoiceLead` exists for Bilal with Status `NEW` and the Handoff Reason documented.

## Test 4: Multilingual Support
**Objective:** Test if the AI switches to Roman Urdu / Urdu.

**Call Flow:**
- **You:** Call the number.
- **AI:** (Greeting, likely in English or Urdu).
- **You:** "Mujhe aap ki location chahiye, kahan par hain aap?" (Roman Urdu)
- **AI:** (Should reply in Urdu/Roman Urdu with the location or FAQ answer).
- **You:** "Shukriya."

**Verification:**
- Check the transcript in **Call Logs** to verify the language shift was captured.
