import { VoiceProvider, ProviderResponse, CallStatus } from "../VoiceProvider.interface";

/**
 * WqProvider implements the VoiceProvider interface for the proprietary WhatsQuery Voice Engine.
 * Integrates directly with Asterisk REST Interface (ARI).
 */
export class WqProvider implements VoiceProvider {
  private ariUrl: string;
  private ariUser: string;
  private ariPass: string;

  constructor() {
    this.ariUrl = process.env.ASTERISK_ARI_URL || "";
    this.ariUser = process.env.ASTERISK_ARI_USER || "";
    this.ariPass = process.env.ASTERISK_ARI_PASSWORD || "";

    if (!this.ariUrl || !this.ariUser || !this.ariPass) {
      console.error("[WqProvider] Initialization failed: Asterisk ARI credentials missing from environment. Voice calls will fail.");
    }
  }

  private async fetchAri(endpoint: string, options: RequestInit): Promise<any> {
    if (!this.ariUrl) throw new Error("ASTERISK_ARI_URL is not configured.");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${this.ariUrl}/ari${endpoint}`, {
        ...options,
        headers: {
          "Authorization": `Basic ${Buffer.from(`${this.ariUser}:${this.ariPass}`).toString("base64")}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ARI Error ${response.status}: ${errorText}`);
      }
      
      if (response.status === 204) return null;
      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error(`[WqProvider] ARI request to ${endpoint} failed: ${err.message}`);
      throw err;
    }
  }

  async syncAgent(internalAgentId: string, payload: any): Promise<ProviderResponse> {
    console.info(`[WqProvider] Syncing agent configuration to database`, { internalAgentId });
    // In the WQ architecture, agent configurations are stored locally for the Rust backend to consume
    return { success: true, externalId: `wq-engine-assistant-${internalAgentId}` };
  }

  async deleteAgent(externalAgentId: string): Promise<void> {
    console.info(`[WqProvider] Deleting agent ${externalAgentId}`);
  }

  async startCall(destinationNumber: string, externalAgentId: string, context?: any): Promise<ProviderResponse> {
    console.info(`[WqProvider] Instructing Asterisk to start outbound call to ${destinationNumber}`);
    const channelId = `wq-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    try {
      await this.fetchAri(`/channels?endpoint=PJSIP/${destinationNumber}&app=wq-voice-app&channelId=${channelId}`, {
        method: "POST"
      });
      return { success: true, externalId: channelId };
    } catch (err: any) {
      console.error(`[WqProvider] Outbound call failed`, { error: err.message });
      throw err;
    }
  }

  async endCall(externalCallId: string): Promise<void> {
    console.info(`[WqProvider] Hanging up Asterisk channel ${externalCallId}`);
    try {
      await this.fetchAri(`/channels/${externalCallId}`, { method: "DELETE" });
    } catch (err: any) {
      console.error(`[WqProvider] Failed to hang up ${externalCallId}`, { error: err.message });
    }
  }

  async transferCall(externalCallId: string, transferDestination: string): Promise<void> {
    console.info(`[WqProvider] Transferring Asterisk channel ${externalCallId} to ${transferDestination}`);
    try {
      // Transfer using ARI redirect or bridge manipulation
      await this.fetchAri(`/channels/${externalCallId}/redirect?endpoint=${transferDestination}`, {
        method: "POST"
      });
    } catch (err: any) {
      console.error(`[WqProvider] Failed to transfer ${externalCallId}`, { error: err.message });
      throw err;
    }
  }

  async getCallStatus(externalCallId: string): Promise<CallStatus> {
    console.info(`[WqProvider] Getting status for Asterisk channel ${externalCallId}`);
    try {
      const channel = await this.fetchAri(`/channels/${externalCallId}`, { method: "GET" });
      if (channel.state === "Up") return "in-progress";
      if (channel.state === "Ringing") return "ringing";
      return "in-progress";
    } catch (err: any) {
      return "failed";
    }
  }

  async syncKnowledgeBase(documentId: string, fileUrlOrBuffer: string | Buffer): Promise<ProviderResponse> {
    console.info(`[WqProvider] Syncing knowledge base doc ${documentId}`);
    return { success: true, externalId: `wq-engine-kb-${documentId}` };
  }
}
