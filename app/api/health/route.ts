import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        PORT: process.env.PORT || "3000"
      },
      services: {
        supabase: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
        },
        vapi: {
          privateKey: process.env.VAPI_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
          publicKey: process.env.VAPI_PUBLIC_KEY ? "✅ Set" : "❌ Missing",
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID ? "✅ Set" : "❌ Missing",
          assistantId: process.env.VAPI_ASSISTANT_ID ? "✅ Set" : "❌ Missing"
        },
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID ? "✅ Set" : "❌ Missing",
          authToken: process.env.TWILIO_AUTH_TOKEN ? "✅ Set" : "❌ Missing",
          phoneNumber: process.env.TWILIO_PHONE_NUMBER ? "✅ Set" : "❌ Missing"
        }
      },
      endpoints: {
        "/api/health": "✅ Working",
        "/api/test-apis": "Available",
        "/api/calls": "Available",
        "/api/script": "Available",
        "/api/assistant": "Available",
        "/api/vapi-test": "Available",
        "/api/hybrid-call": "Available",
        "/api/vapi-call": "Available"
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
