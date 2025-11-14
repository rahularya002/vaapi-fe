import { NextRequest, NextResponse } from "next/server";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";
import { supabase } from "@/lib/supabase";

const VAPI_API_URL = "https://api.vapi.ai/call";
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, candidateName, candidateId, assistantId } = body;

    if (!VAPI_PRIVATE_KEY || !process.env.VAPI_PHONE_NUMBER_ID || !process.env.VAPI_ASSISTANT_ID) {
      return NextResponse.json(
        { error: "Vapi credentials not configured. Missing VAPI_PRIVATE_KEY, VAPI_PHONE_NUMBER_ID, or VAPI_ASSISTANT_ID" },
        { status: 500 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format and validate phone number for E.164 format
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { 
          error: `Invalid phone number: ${phoneValidation.error}`,
          formatted: phoneValidation.formatted,
          original: phoneNumber
        },
        { status: 400 }
      );
    }

    const formattedPhone = phoneValidation.formatted;

    // Prepare the call request - use VAPI assistant directly
    const callRequest = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: formattedPhone,
        name: candidateName || "Candidate"
      },
      assistantId: assistantId || process.env.VAPI_ASSISTANT_ID,
      // Remove customerId - VAPI will create customer automatically
      metadata: {
        candidateName,
        candidateId: candidateId?.toString(),
        callType: "interview",
        timestamp: new Date().toISOString()
      }
    };


    // Make the call via Vapi API
    const response = await fetch(VAPI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(callRequest)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Vapi API error:", result);
      return NextResponse.json(
        { error: result.message || "Failed to initiate call" },
        { status: response.status }
      );
    }

    // Store vapi_call_id in candidates table if candidateId provided
    if (candidateId && supabase) {
      try {
        await supabase
          .from('candidates')
          .update({ 
            vapi_call_id: result.id,
            call_start_time: new Date().toISOString()
          })
          .eq('id', parseInt(candidateId));
      } catch (error) {
        console.error("Error storing vapi_call_id:", error);
      }
    }

    return NextResponse.json({
      success: true,
      callId: result.id,
      status: result.status,
      message: "Call initiated successfully"
    });

  } catch (error) {
    console.error("Error initiating call:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}

// Get call status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${VAPI_API_URL}/${callId}`, {
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to get call status" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      call: result
    });

  } catch (error) {
    console.error("Error getting call status:", error);
    return NextResponse.json(
      { error: "Failed to get call status" },
      { status: 500 }
    );
  }
}
