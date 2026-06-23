export type ProviderResponse = {
  success: boolean;
  externalId?: string;
  error?: string;
  metadata?: any;
};

export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'canceled';

export interface VoiceProvider {
  /**
   * Initializes or updates an AI agent on the provider's infrastructure.
   */
  syncAgent(internalAgentId: string, payload: any): Promise<ProviderResponse>;

  /**
   * Deletes an AI agent from the provider's infrastructure.
   */
  deleteAgent(externalAgentId: string): Promise<void>;

  /**
   * Initiates an outbound call.
   */
  startCall(destinationNumber: string, externalAgentId: string, context?: any): Promise<ProviderResponse>;

  /**
   * Ends an active call.
   */
  endCall(externalCallId: string): Promise<void>;

  /**
   * Transfers a call to another destination.
   */
  transferCall(externalCallId: string, transferDestination: string): Promise<void>;

  /**
   * Retrieves the current status of a call.
   */
  getCallStatus(externalCallId: string): Promise<CallStatus>;

  /**
   * Synchronizes a knowledge base document with the provider's vector DB.
   */
  syncKnowledgeBase(documentId: string, fileUrlOrBuffer: string | Buffer): Promise<ProviderResponse>;
}
