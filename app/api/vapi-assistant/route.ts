import { NextRequest, NextResponse } from "next/server";

const VAPI_API_URL = "https://api.vapi.ai/assistant";
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

// Create a new VAPI assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      model, 
      voice, 
      transcription, 
      instructions, 
      firstMessage,
      firstMessageMode,
      maxDurationSeconds = 600,
      interruptionThreshold = 1000,
      backgroundSound = "office",
      silenceTimeoutSeconds = 5,
      responseDelaySeconds = 0.5
    } = body;

    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    // Create assistant configuration
    const assistantConfig = {
      name: name || "Interview Assistant",
      model: model || {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000
      },
      voice: voice || {
        provider: "elevenlabs",
        voiceId: "adam",
        speed: 1.0,
        pitch: 1.0
      },
      transcription: transcription || {
        provider: "deepgram",
        model: "nova-2",
        language: "multi"
      },
      firstMessage: firstMessage || "Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?",
      ...(firstMessageMode && { messageMode: firstMessageMode }),
      instructions: instructions || `You are a professional interview assistant conducting phone interviews for job candidates. 

Your role is to:
1. Greet the candidate professionally
2. Ask relevant interview questions
3. Listen actively to their responses
4. Take notes of key information
5. Be friendly but professional
6. If they ask to speak to a human, explain this is an automated screening
7. Thank them for their time at the end

Always be respectful, patient, and professional.`,
      maxDurationSeconds,
      interruptionThreshold,
      backgroundSound,
      silenceTimeoutSeconds,
      responseDelaySeconds,
      // Additional VAPI features
      endCallMessage: "Thank you for your time! We'll be in touch soon.",
      endCallPhrases: ["goodbye", "thank you", "have a great day", "talk to you later"],
      // Function calling capabilities
      functions: [
        {
          name: "take_notes",
          description: "Take notes about the candidate's responses",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "The question that was asked"
              },
              response: {
                type: "string", 
                description: "The candidate's response"
              },
              key_points: {
                type: "array",
                items: { type: "string" },
                description: "Key points from the response"
              }
            },
            required: ["question", "response"]
          }
        },
        {
          name: "collect_candidate_info",
          description: "Collect and save candidate information like name, email, position, and other details during the call",
          parameters: {
            type: "object",
            properties: {
              candidate_name: {
                type: "string",
                description: "Full name of the candidate"
              },
              email: {
                type: "string",
                description: "Email address of the candidate"
              },
              position: {
                type: "string",
                description: "Position or job title the candidate is interested in"
              },
              phone: {
                type: "string",
                description: "Phone number (if different or confirmed)"
              },
              additional_info: {
                type: "object",
                description: "Any additional information collected during the call",
                additionalProperties: true
              }
            },
            required: ["candidate_name"]
          }
        },
        {
          name: "schedule_follow_up",
          description: "Schedule a follow-up call or meeting",
          parameters: {
            type: "object",
            properties: {
              candidate_name: {
                type: "string",
                description: "Name of the candidate"
              },
              preferred_time: {
                type: "string",
                description: "Preferred time for follow-up"
              },
              reason: {
                type: "string",
                description: "Reason for follow-up"
              }
            },
            required: ["candidate_name", "reason"]
          }
        }
      ]
    };

    // Create the assistant via VAPI API
    const response = await fetch(VAPI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(assistantConfig)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("VAPI Assistant creation error:", result);
      return NextResponse.json(
        { error: result.message || "Failed to create assistant" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      assistant: result,
      message: "Assistant created successfully"
    });

  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}

// Get all assistants or specific assistant
export async function GET(request: NextRequest) {
  try {
    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistantId");

    // If specific assistant ID is requested
    if (assistantId) {
      const response = await fetch(`${VAPI_API_URL}/${assistantId}`, {
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: result.message || "Failed to get assistant" },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        assistant: result
      });
    }

    // Get all assistants
    const response = await fetch(VAPI_API_URL, {
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to get assistants" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      assistants: result
    });

  } catch (error) {
    console.error("Error getting assistants:", error);
    return NextResponse.json(
      { error: "Failed to get assistants" },
      { status: 500 }
    );
  }
}

// Update an assistant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assistantId, ...updateData } = body;

    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${VAPI_API_URL}/${assistantId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to update assistant" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      assistant: result,
      message: "Assistant updated successfully"
    });

  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

// Delete an assistant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get("assistantId");

    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY not configured" },
        { status: 500 }
      );
    }

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${VAPI_API_URL}/${assistantId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`
      }
    });

    if (!response.ok) {
      const result = await response.json();
      return NextResponse.json(
        { error: result.message || "Failed to delete assistant" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assistant deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
}
