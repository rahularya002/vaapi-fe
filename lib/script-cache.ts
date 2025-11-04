import { configApi, CallConfig } from './supabase';

let cachedConfig: CallConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export class ScriptCache {
  static async getConfig(): Promise<CallConfig> {
    const now = Date.now();
    if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) return cachedConfig;
    try {
      const config = await (configApi as any).get();
      if (config) { cachedConfig = config; lastFetchTime = now; return config; }
      return this.getDefaultConfig();
    } catch {
      return cachedConfig || this.getDefaultConfig();
    }
  }
  static async refreshConfig(): Promise<CallConfig> { cachedConfig = null; lastFetchTime = 0; return this.getConfig(); }
  static getDefaultConfig(): CallConfig {
    return {
      method: 'hybrid' as any,
      script: `Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

1. Can you tell me about yourself and your background?
2. What interests you about this position?
3. What are your key strengths and skills?
4. Do you have any questions about the role or company?
5. What is your availability for the next steps?

Thank you for your time!`,
      voice_settings: { provider: 'elevenlabs', voice_id: 'adam', speed: 1.0, pitch: 1.0 },
      call_settings: { max_duration: 15, retry_attempts: 2, delay_between_calls: 30 }
    } as any;
  }
}


