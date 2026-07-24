import { IVoiceOrchestrator, AgentConfig, CallLogQuery } from "./IVoiceOrchestrator";

export class VapiAdapter implements IVoiceOrchestrator {
  private getApiKey(): string {
    const key = process.env.VAPI_PRIVATE_API_KEY;
    if (!key) throw new Error("VAPI_PRIVATE_API_KEY is missing");
    return key;
  }

  getProviderName(): string {
    return "VAPI";
  }

  async provisionNumber(areaCode: string): Promise<{ id: string; number: string }> {
    // Note: VAPI supports purchasing Twilio/Vonage numbers through their API.
    // This is a stub implementation.
    return {
      id: "vapi-number-stub-123",
      number: `+1${areaCode}5550199`
    };
  }

  async deployAgent(config: AgentConfig): Promise<string> {
    const assistantName = `WQ | ${config.organizationId} | ${config.name} | PROD`;
    const serverUrl = "https://voice.whatsquery.com/api/webhooks/vapi";

    const payload = {
      name: assistantName,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: config.systemPrompt }],
      },
      voice: {
        provider: "11labs",
        voiceId: config.voiceId || "bIHbv24MWmeRgasZH58o"
      },
      serverUrl: serverUrl,
      endCallPhrases: ["goodbye", "bye", "khuda hafiz", "allah hafiz"]
    };

    const response = await fetch(`https://api.vapi.ai/assistant`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.getApiKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Vapi deploy failed: ${await response.text()}`);
    }

    const data = await response.json();
    return data.id;
  }

  async getCallLogs(query: CallLogQuery): Promise<any[]> {
    // This queries the VAPI get calls endpoint.
    // A production implementation would paginate and filter by assistantId
    return [];
  }
}
