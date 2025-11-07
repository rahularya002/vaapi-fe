export interface Candidate {
  id: number;
  name: string;
  phone: string;
  email: string;
  position: string;
  status: string;
  call_result?: string;
  call_notes?: string;
  call_time?: string;
  vapi_call_id?: string;
  call_start_time?: string;
  call_end_time?: string;
  // VAPI call log fields
  assistant_name?: string;
  assistant_id?: string;
  assistant_phone_number?: string;
  call_type?: string; // "outbound" | "web"
  ended_reason?: string;
  success_evaluation?: string; // "pass" | "fail"
  score?: string;
  call_duration?: number; // in seconds
  call_cost?: number;
}

export interface CallConfiguration {
  method: "vapi";
  script: string;
  voiceSettings: {
    provider: string;
    voiceId: string;
    speed: number;
    pitch: number;
  };
  callSettings: {
    maxDuration: number;
    retryAttempts: number;
    delayBetweenCalls: number;
  };
}

export interface AssistantConfig {
  name: string;
  language: string;
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  voice: {
    provider: string;
    voiceId: string;
    speed: number;
    pitch: number;
  };
  transcription: {
    provider: string;
    model: string;
    language: string;
  };
  instructions: string;
  firstMessage?: string;
  firstMessageMode?: string;
  maxDurationSeconds: number;
  interruptionThreshold: number;
  backgroundSound: string;
  silenceTimeoutSeconds: number;
  responseDelaySeconds: number;
}

export interface AssistantStatus {
  isConfigured: boolean;
  assistantId: string | null;
  lastTested: string | null;
}


