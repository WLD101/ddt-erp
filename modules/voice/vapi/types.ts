// modules/voice/vapi/types.ts

export interface VapiWebhookPayload {
  message: {
    type: string;
    call?: VapiCall;
    assistant?: any;
    toolCalls?: VapiToolCall[];
    toolCallList?: VapiToolCall[];
    transcript?: string;
    messages?: any[];
    summary?: string;
    recordingUrl?: string;
    endedReason?: string;
    durationSeconds?: number;
    [key: string]: any;
  };
}

export interface VapiCall {
  id: string;
  assistantId?: string;
  phoneNumberId?: string;
  customer?: {
    number?: string;
    name?: string;
  };
  status?: string;
  direction?: string;
  [key: string]: any;
}

export interface VapiToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: any;
  };
}

export interface VapiWebhookResponse {
  results?: any[];
  assistant?: any;
  destination?: any;
  messageResponse?: any;
  error?: string;
  [key: string]: any;
}
