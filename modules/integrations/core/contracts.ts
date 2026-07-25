import type {
  ConnectionTestResult,
  CredentialRefreshResult,
  IntegrationActionRequest,
  IntegrationActionResult,
  IntegrationEventRequest,
  IntegrationEventResult,
  IntegrationExecutionContext,
  IntegrationSyncRequest,
  IntegrationSyncResult,
  ResourceQuery,
  ResourceResult,
  WebhookSubscriptionResult,
} from "./types";

export interface IntegrationProviderAdapter {
  readonly key: string;

  testConnection(
    context: IntegrationExecutionContext
  ): Promise<ConnectionTestResult>;

  disconnect?(
    context: IntegrationExecutionContext
  ): Promise<void>;

  getResources?(
    context: IntegrationExecutionContext,
    input: ResourceQuery
  ): Promise<ResourceResult>;

  executeAction?(
    context: IntegrationExecutionContext,
    input: IntegrationActionRequest
  ): Promise<IntegrationActionResult>;

  sync?(
    context: IntegrationExecutionContext,
    input: IntegrationSyncRequest
  ): Promise<IntegrationSyncResult>;

  handleEvent?(
    context: IntegrationExecutionContext,
    input: IntegrationEventRequest
  ): Promise<IntegrationEventResult>;

  refreshCredentials?(
    context: IntegrationExecutionContext
  ): Promise<CredentialRefreshResult>;

  subscribeWebhooks?(
    context: IntegrationExecutionContext
  ): Promise<WebhookSubscriptionResult>;

  unsubscribeWebhooks?(
    context: IntegrationExecutionContext
  ): Promise<void>;
}
