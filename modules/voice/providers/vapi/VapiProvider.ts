import { VoiceProvider, ProviderResponse, CallStatus } from "../VoiceProvider.interface";
import { logger } from "@/lib/observability/logger";

export class VapiProvider implements VoiceProvider {
  private apiKey: string;
  private baseUrl = "https://api.vapi.ai";
  
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY || "";
    if (!this.apiKey) {
      logger.error("[VapiProvider] Initialization failed: VAPI_API_KEY environment variable is not configured. Voice calls will fail.");
    }
  }

  private async fetchWithRetry(endpoint: string, options: RequestInit, retries = 3): Promise<any> {
    if (!this.apiKey) {
      throw new Error("VAPI_API_KEY is not configured in the environment.");
    }

    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Vapi API error: ${response.status} ${errorBody}`);
        }

        if (response.status === 204) return null;
        return await response.json();
      } catch (err: any) {
        lastError = err;
        logger.warn(`[VapiProvider] API request failed (Attempt ${attempt}/${retries}): ${err.message}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    logger.error(`[VapiProvider] Request to ${endpoint} exhausted retries.`);
    throw lastError;
  }

  async syncAgent(internalAgentId: string, payload: any): Promise<ProviderResponse> {
    logger.info(`[VapiProvider] Syncing agent ${internalAgentId}`, { internalAgentId });
    try {
      const result = await this.fetchWithRetry("/assistant", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return { success: true, externalId: result.id };
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to sync agent ${internalAgentId}`, { error: err.message });
      throw err;
    }
  }

  async deleteAgent(externalAgentId: string): Promise<void> {
    logger.info(`[VapiProvider] Deleting agent ${externalAgentId}`);
    try {
      await this.fetchWithRetry(`/assistant/${externalAgentId}`, { method: "DELETE" });
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to delete agent ${externalAgentId}`, { error: err.message });
      throw err;
    }
  }

  async startCall(destinationNumber: string, externalAgentId: string, context?: any): Promise<ProviderResponse> {
    logger.info(`[VapiProvider] Starting outbound call to ${destinationNumber}`);
    try {
      const result = await this.fetchWithRetry("/call", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberId: context?.phoneNumberId || undefined,
          assistantId: externalAgentId,
          customer: { number: destinationNumber },
          metadata: context || {}
        })
      });
      return { success: true, externalId: result.id };
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to start call`, { destinationNumber, error: err.message });
      throw err;
    }
  }

  async endCall(externalCallId: string): Promise<void> {
    logger.info(`[VapiProvider] Ending call ${externalCallId}`);
    try {
      await this.fetchWithRetry(`/call/${externalCallId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ended" })
      });
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to end call ${externalCallId}`, { error: err.message });
      throw err;
    }
  }

  async transferCall(externalCallId: string, transferDestination: string): Promise<void> {
    logger.info(`[VapiProvider] Transferring call ${externalCallId} to ${transferDestination}`);
    try {
      await this.fetchWithRetry(`/call/${externalCallId}/transfer`, {
        method: "POST",
        body: JSON.stringify({ destination: transferDestination })
      });
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to transfer call ${externalCallId}`, { error: err.message });
      throw err;
    }
  }

  async getCallStatus(externalCallId: string): Promise<CallStatus> {
    logger.info(`[VapiProvider] Getting status for call ${externalCallId}`);
    try {
      const result = await this.fetchWithRetry(`/call/${externalCallId}`, { method: "GET" });
      
      switch (result.status) {
        case "queued": return "ringing";
        case "ringing": return "ringing";
        case "in-progress": return "in-progress";
        case "ended": return "completed";
        case "failed": return "failed";
        default: return "in-progress";
      }
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to get call status ${externalCallId}`, { error: err.message });
      throw err;
    }
  }

  async syncKnowledgeBase(documentId: string, fileUrlOrBuffer: string | Buffer): Promise<ProviderResponse> {
    logger.info(`[VapiProvider] Syncing knowledge base doc ${documentId}`);
    try {
      const result = await this.fetchWithRetry("/file", {
        method: "POST",
        body: JSON.stringify({ url: typeof fileUrlOrBuffer === "string" ? fileUrlOrBuffer : "" })
      });
      return { success: true, externalId: result.id };
    } catch (err: any) {
      logger.error(`[VapiProvider] Failed to sync KB doc ${documentId}`, { error: err.message });
      throw err;
    }
  }
}
