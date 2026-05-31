// scripts/voice-test-vapi-webhook.ts
// Usage: npx tsx scripts/voice-test-vapi-webhook.ts

import fetch from "node-fetch";

const WEBHOOK_URL = process.env.VAPI_SERVER_URL || "http://localhost:3000/api/voice/vapi/webhook";
const SECRET = process.env.VAPI_WEBHOOK_SECRET || "";

async function sendWebhook(payload: any) {
  console.log(`Sending ${payload.message.type}...`);
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vapi-secret": SECRET,
        // Since we don't have a real assistant-tenant mapping in the DB yet,
        // we pass an explicit tenant ID header for local testing to avoid writing to arbitrary tenants.
        "x-tenant-id": "test-org-id" 
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Response ${res.status}:`, text);
  } catch (err) {
    console.error("Error sending webhook:", err);
  }
}

async function runTests() {
  console.log("Testing Vapi Webhook Handlers");
  
  // 1. Assistant Request
  await sendWebhook({
    message: {
      type: "assistant-request",
      call: { id: "test-call-123", customer: { number: "+1234567890" } }
    }
  });

  // 2. Status Update (started)
  await sendWebhook({
    message: {
      type: "status-update",
      status: "started",
      call: { id: "test-call-123", customer: { number: "+1234567890" } }
    }
  });

  // 3. Tool Call (capture_lead)
  await sendWebhook({
    message: {
      type: "tool-calls",
      call: { id: "test-call-123" },
      toolWithToolCallList: [
        {
          id: "tool-call-1",
          function: {
            name: "capture_lead",
            arguments: { name: "Test User", phone: "123", reasonForCall: "Testing" }
          }
        }
      ]
    }
  });

  // 4. End of Call Report
  await sendWebhook({
    message: {
      type: "end-of-call-report",
      call: { id: "test-call-123" },
      endedReason: "customer-hung-up",
      durationSeconds: 120,
      summary: "User wanted to test the system.",
      transcript: "Hello. \nHi, testing. \nGoodbye.",
      recordingUrl: "https://example.com/recording.wav"
    }
  });
}

runTests();
