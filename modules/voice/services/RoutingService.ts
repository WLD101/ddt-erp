import { ProviderFactory } from "../providers/ProviderFactory";
import { WqProvider } from "../providers/whatsquery/WqProvider";

/**
 * RoutingService determines how to bridge inbound SIP calls coming from the Telco (via Asterisk)
 * to the currently configured Voice Provider.
 */
export class RoutingService {
  
  /**
   * Generates the SIP URI that Asterisk should bridge the call to.
   * 
   * @param tenantId The organization ID of the tenant receiving the call
   * @param inboundNumber The phone number the caller dialed
   * @returns SIP URI destination (e.g., sip:vapi-assistant-id@vapi.io)
   */
  static async resolveSipDestination(tenantId: string, inboundNumber: string): Promise<string> {
    // 1. Look up the tenant's active VoiceAgent for this inbound number via Prisma
    // const voiceAgent = await prisma.voiceAgent.findFirst(...)
    
    // 2. Fetch the active VoiceProvider mapping for this agent
    const provider = ProviderFactory.getProvider();

    // 3. Resolve the exact SIP URI based on the provider
    if (provider instanceof WqProvider) {
      // Routing to our proprietary Asterisk/Rust cluster
      // return `sip:agent-${voiceAgent.id}@engine.whatsquery.com`;
      return `sip:dummy-wq-agent@engine.whatsquery.com`;
    } else {
      // Routing to Vapi
      // const mapping = await prisma.providerMapping.findUnique({ ... })
      // return `sip:${mapping.externalId}@sip.vapi.ai`;
      return `sip:dummy-vapi-agent@sip.vapi.ai`;
    }
  }

  /**
   * Asterisk ARI (Asterisk REST Interface) Webhook Handler.
   * When Asterisk receives an inbound call, it hits this endpoint to ask where to bridge it.
   */
  static async handleAsteriskInboundCall(ariEventPayload: any) {
    const callerId = ariEventPayload.caller.number;
    const dialedNumber = ariEventPayload.channel.dialed.number;
    const tenantId = ariEventPayload.channel.vars.tenant_id; // Extracted via PJSIP headers

    console.log(`[RoutingService] Inbound call from ${callerId} to ${dialedNumber}`);

    const sipDestination = await this.resolveSipDestination(tenantId, dialedNumber);
    
    console.log(`[RoutingService] Instructing Asterisk to bridge call to: ${sipDestination}`);

    // TODO: Send HTTP request back to Asterisk ARI to originate/bridge the channel to sipDestination
  }
}
