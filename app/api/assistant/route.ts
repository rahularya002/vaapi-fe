import { NextRequest, NextResponse } from "next/server";
import { ScriptCache } from "@/lib/script-cache";
import { AssistantConfig } from "@/lib/types";

export async function GET() {
  try {
    // Get the current script from cache (fast, no DB query during calls)
    const config = await ScriptCache.getConfig();
    
    // Try to get assistant config from database
    let assistantConfig: Partial<AssistantConfig> = {
      name: process.env.ASSISTANT_NAME || "Interview Assistant",
      language: process.env.ASSISTANT_LANGUAGE || "en",
      model: {
        provider: process.env.MODEL_PROVIDER || "openai",
        model: process.env.MODEL_NAME || "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
      },
      voice: {
        provider: config.voice_settings.provider,
        voiceId: config.voice_settings.voice_id,
        speed: config.voice_settings.speed,
        pitch: config.voice_settings.pitch,
      },
      transcription: {
        provider: process.env.TRANSCRIPTION_PROVIDER || "deepgram",
        model: process.env.TRANSCRIPTION_MODEL || "nova-2",
        language: process.env.TRANSCRIPTION_LANGUAGE || "multi",
      },
      instructions: config.script || "",
    };

    // Try to get assistant settings from database
    try {
      const { configApi } = await import("@/lib/supabase");
      const dbConfig = await configApi.get();
      
      if (dbConfig && dbConfig.assistant_name) {
        assistantConfig = {
          name: dbConfig.assistant_name || assistantConfig.name,
          language: dbConfig.assistant_language || assistantConfig.language,
          model: {
            provider: dbConfig.model_provider || assistantConfig.model?.provider || "openai",
            model: dbConfig.model_name || assistantConfig.model?.model || "gpt-4o-mini",
            temperature: dbConfig.model_temperature || assistantConfig.model?.temperature || 0.7,
            maxTokens: dbConfig.model_max_tokens || assistantConfig.model?.maxTokens || 1000,
          },
          voice: {
            provider: dbConfig.voice_provider || assistantConfig.voice?.provider || "elevenlabs",
            voiceId: dbConfig.voice_id || assistantConfig.voice?.voiceId || "adam",
            speed: dbConfig.voice_speed || assistantConfig.voice?.speed || 1.0,
            pitch: dbConfig.voice_pitch || assistantConfig.voice?.pitch || 1.0,
          },
          transcription: {
            provider: dbConfig.transcription_provider || assistantConfig.transcription?.provider || "deepgram",
            model: dbConfig.transcription_model || assistantConfig.transcription?.model || "nova-2",
            language: dbConfig.transcription_language || assistantConfig.transcription?.language || "multi",
          },
          instructions: dbConfig.instructions || assistantConfig.instructions,
          firstMessage: dbConfig.first_message || assistantConfig.firstMessage || undefined,
          firstMessageMode: dbConfig.first_message_mode || assistantConfig.firstMessageMode || undefined,
        };
      }
    } catch (dbError) {
      console.warn("Could not load assistant config from database, using defaults:", dbError);
    }

    // Apply Hindi-specific settings if language is Hindi
    if (assistantConfig.language === "hi") {
      assistantConfig.transcription = {
        provider: "deepgram",
        model: "nova-2",
        language: "hi",
      };
      assistantConfig.voice = {
        provider: "elevenlabs",
        voiceId: process.env.HINDI_VOICE_ID || "hindi-male-1",
        speed: 1.0,
        pitch: 1.0
      };
    }

    return NextResponse.json(assistantConfig);
  } catch (error) {
    console.error("Error getting assistant config:", error);
    
    // Fallback to default config if cache fails
    const defaultConfig = ScriptCache.getDefaultConfig();
    
    return NextResponse.json({
      name: "Interview Assistant",
      language: "en",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
      },
      voice: {
        provider: defaultConfig.voice_settings.provider,
        voiceId: defaultConfig.voice_settings.voice_id,
        speed: defaultConfig.voice_settings.speed,
        pitch: defaultConfig.voice_settings.pitch,
      },
      transcription: {
        provider: "deepgram",
        model: "nova-2",
        language: "multi",
      },
      instructions: defaultConfig.script || "",
      firstMessage: undefined,
      firstMessageMode: undefined,
    });
  }
}

// Update assistant configuration (triggers cache refresh)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current config to preserve existing settings
    const currentConfig = await ScriptCache.getConfig();
    
    // Transform the assistant config to match database schema
    const assistantConfig = {
      // Required fields
      method: currentConfig.method,
      script: currentConfig.script,
      voice_settings: currentConfig.voice_settings,
      call_settings: currentConfig.call_settings,
      // Assistant configuration fields
      assistant_name: body.name || "Interview Assistant",
      assistant_language: body.language || "en",
      model_provider: body.model?.provider || "openai",
      model_name: body.model?.model || "gpt-4o-mini",
      voice_provider: body.voice?.provider || "elevenlabs",
      voice_id: body.voice?.voiceId || "adam",
      voice_speed: body.voice?.speed || 1.0,
      voice_pitch: body.voice?.pitch || 1.0,
      transcription_provider: body.transcription?.provider || "deepgram",
      transcription_model: body.transcription?.model || "nova-2",
      transcription_language: body.transcription?.language || "multi",
      instructions: body.instructions || "",
      first_message: body.firstMessage || "",
      first_message_mode: body.firstMessageMode || "assistant-speaks-first",
      max_duration_seconds: body.maxDurationSeconds || 600,
      interruption_threshold: body.interruptionThreshold || 1000,
      background_sound: body.backgroundSound || "office",
      silence_timeout_seconds: body.silenceTimeoutSeconds || 5,
      response_delay_seconds: body.responseDelaySeconds || 0.5,
      assistant_settings: {
        name: body.name,
        language: body.language,
        model: body.model,
        voice: body.voice,
        transcription: body.transcription,
        instructions: body.instructions,
        firstMessage: body.firstMessage,
        firstMessageMode: body.firstMessageMode,
        maxDurationSeconds: body.maxDurationSeconds,
        interruptionThreshold: body.interruptionThreshold,
        backgroundSound: body.backgroundSound,
        silenceTimeoutSeconds: body.silenceTimeoutSeconds,
        responseDelaySeconds: body.responseDelaySeconds
      }
    };
    
    // Save to database
    const { configApi } = await import("@/lib/supabase");
    await configApi.save(assistantConfig);
    
    // Refresh cache immediately
    await ScriptCache.refreshConfig();
    
    return NextResponse.json({
      success: true,
      message: "Assistant configuration updated and cache refreshed"
    });
  } catch (error) {
    console.error("Error updating assistant config:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}