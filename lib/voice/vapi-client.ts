export async function syncAgentToVapi(prompt: string, config: any) {
  const {
    vapiAssistantId,
    businessSlug,
    agentSlug,
    firstMessage,
    voiceId,
  } = config;

  const VAPI_PRIVATE_API_KEY = process.env.VAPI_PRIVATE_API_KEY;
  if (!VAPI_PRIVATE_API_KEY) {
    throw new Error("VAPI_PRIVATE_API_KEY is missing");
  }

  const assistantName = `WQ | ${businessSlug} | ${agentSlug} | PROD`;
  const serverUrl = "https://voice.whatsquery.com/api/webhooks/vapi";

  const tools = [
    {
      type: "dtmf",
      messages: [{ type: "request-start", content: "Processing your selection..." }]
    },
    {
      type: "function",
      function: {
        name: "lookup_faq",
        description: "Lookup frequently asked questions for the business.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
      }
    },
    {
      type: "function",
      function: {
        name: "get_business_hours",
        description: "Get the opening hours for the business.",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "capture_lead",
        description: "Capture a lead for a callback or general inquiry.",
        parameters: { 
          type: "object", 
          properties: { name: { type: "string" }, phone: { type: "string" }, reason: { type: "string" } }, 
          required: ["reason"] 
        }
      }
    },
    {
      type: "function",
      function: {
        name: "request_appointment",
        description: "Request an appointment or table booking.",
        parameters: { 
          type: "object", 
          properties: { name: { type: "string" }, phone: { type: "string" }, partySize: { type: "number" }, time: { type: "string" } }, 
          required: ["name", "time"] 
        }
      }
    },
    {
      type: "function",
      function: {
        name: "create_order_request",
        description: "Create an order or takeaway request.",
        parameters: { 
          type: "object", 
          properties: { name: { type: "string" }, phone: { type: "string" }, details: { type: "string" } }, 
          required: ["name", "details"] 
        }
      }
    },
    {
      type: "function",
      function: {
        name: "handoff_to_staff",
        description: "Request a handoff to human staff.",
        parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] }
      }
    },
    {
      type: "function",
      function: {
        name: "summarize_call",
        description: "Summarize the call before ending.",
        parameters: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] }
      }
    }
  ];

  const payload = {
    name: assistantName,
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      tools: tools
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId || "bIHbv24MWmeRgasZH58o" // fallback generic voice
    },
    firstMessage: firstMessage,
    serverUrl: serverUrl,
    endCallPhrases: ["goodbye", "bye", "khuda hafiz", "allah hafiz"]
  };

  let response;
  if (vapiAssistantId) {
    // Update
    response = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } else {
    // Create
    response = await fetch(`https://api.vapi.ai/assistant`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vapi sync failed: ${errorText}`);
  }

  const data = await response.json();
  return {
    assistantId: data.id
  };
}
