import { EventEmitter } from 'events';
import { ProviderFactory } from '../providers/ProviderFactory';

// Define typed events
export interface VoiceEvents {
  AgentCreated: { internalAgentId: string; payload: any };
  AgentUpdated: { internalAgentId: string; payload: any };
  AgentDeleted: { externalAgentId: string };
  KnowledgeBaseSynced: { documentId: string; fileUrlOrBuffer: string | Buffer };
  CallStarted: { callId: string; destination: string; externalAgentId: string };
}

class VoiceEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  private setupListeners() {
    this.on('AgentCreated', async (data: VoiceEvents['AgentCreated']) => {
      console.log(`[EventBus] Handling AgentCreated for ${data.internalAgentId}`);
      const provider = ProviderFactory.getProvider();
      const response = await provider.syncAgent(data.internalAgentId, data.payload);
      // TODO: Save provider.externalId to ProviderMapping table via Prisma
    });

    this.on('AgentUpdated', async (data: VoiceEvents['AgentUpdated']) => {
      console.log(`[EventBus] Handling AgentUpdated for ${data.internalAgentId}`);
      const provider = ProviderFactory.getProvider();
      await provider.syncAgent(data.internalAgentId, data.payload);
    });

    this.on('AgentDeleted', async (data: VoiceEvents['AgentDeleted']) => {
      console.log(`[EventBus] Handling AgentDeleted for ${data.externalAgentId}`);
      const provider = ProviderFactory.getProvider();
      await provider.deleteAgent(data.externalAgentId);
    });

    this.on('KnowledgeBaseSynced', async (data: VoiceEvents['KnowledgeBaseSynced']) => {
      console.log(`[EventBus] Handling KnowledgeBaseSynced for ${data.documentId}`);
      const provider = ProviderFactory.getProvider();
      const response = await provider.syncKnowledgeBase(data.documentId, data.fileUrlOrBuffer);
      // TODO: Save external ID to ProviderMapping table
    });
  }

  public emitEvent<K extends keyof VoiceEvents>(event: K, payload: VoiceEvents[K]): boolean {
    // In the future, this can be swapped out with a Kafka producer or Redis Pub/Sub publisher
    return this.emit(event, payload);
  }
}

// Export singleton instance
export const voiceEventBus = new VoiceEventBus();
