export type AgentConfig = {
  organizationId: string;
  name: string;
  systemPrompt: string;
  voiceId?: string;
  phoneNumber?: string;
};

export type CallLogQuery = {
  organizationId: string;
  startDate: Date;
  endDate: Date;
};

export interface IVoiceOrchestrator {
  /**
   * Provisions a new SIP or PSTN phone number for the tenant.
   */
  provisionNumber(areaCode: string): Promise<{ id: string; number: string }>;

  /**
   * Deploys a new voice agent with the specified configuration.
   */
  deployAgent(config: AgentConfig): Promise<string>;

  /**
   * Fetches raw call logs from the provider for syncing.
   */
  getCallLogs(query: CallLogQuery): Promise<any[]>;

  /**
   * Retrieves the current provider name.
   */
  getProviderName(): string;
}
