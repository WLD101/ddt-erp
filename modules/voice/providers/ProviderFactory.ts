import { VoiceProvider } from "./VoiceProvider.interface";
import { VapiProvider } from "./vapi/VapiProvider";
import { WqProvider } from "./whatsquery/WqProvider";

export class ProviderFactory {
  static getProvider(): VoiceProvider {
    const providerName = process.env.VOICE_PROVIDER || 'vapi';
    
    switch (providerName.toLowerCase()) {
      case 'whatsquery':
        return new WqProvider();
      case 'vapi':
      default:
        return new VapiProvider();
    }
  }
}
