import { NextRequest, NextResponse } from "next/server";

const VAPI_API_URL = "https://api.vapi.ai/assistant";
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

// Assistant interface for client (hides VAAPI details)
export interface Assistant {
  id: string;
  name: string;
  description?: string;
  status: "active" | "idle";
  firstMessage?: string;
  script?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper to map VAAPI assistant to client-friendly format
function mapVapiAssistantToClient(vapiAssistant: any): Assistant {
  return {
    id: vapiAssistant.id,
    name: vapiAssistant.name || "Unnamed Assistant",
    description: vapiAssistant.description || vapiAssistant.name || "AI calling assistant",
    status: vapiAssistant.status === "active" ? "active" : "idle",
    firstMessage: vapiAssistant.firstMessage || "",
    script: vapiAssistant.instructions || vapiAssistant.model?.systemMessage || "",
    createdAt: vapiAssistant.createdAt,
    updatedAt: vapiAssistant.updatedAt,
  };
}

// GET - Fetch all assistants
export async function GET(request: NextRequest) {
  try {
    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(VAPI_API_URL, {
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch assistants" },
        { status: response.status }
      );
    }

    const vapiAssistants = await response.json();
    // VAAPI might return an array or an object with an array property
    let assistantsArray: any[] = [];
    if (Array.isArray(vapiAssistants)) {
      assistantsArray = vapiAssistants;
    } else if (vapiAssistants.data && Array.isArray(vapiAssistants.data)) {
      assistantsArray = vapiAssistants.data;
    } else if (vapiAssistants.assistants && Array.isArray(vapiAssistants.assistants)) {
      assistantsArray = vapiAssistants.assistants;
    } else if (typeof vapiAssistants === 'object' && vapiAssistants.id) {
      // Single assistant object
      assistantsArray = [vapiAssistants];
    }
    
    const assistants: Assistant[] = assistantsArray.map(mapVapiAssistantToClient);

    return NextResponse.json({
      success: true,
      assistants,
    });
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}

// PATCH - Update assistant (only firstMessage and script)
export async function PATCH(request: NextRequest) {
  try {
    if (!VAPI_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, firstMessage, script } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    // Build update payload - only include fields that are provided
    const updatePayload: any = {};
    if (firstMessage !== undefined) {
      updatePayload.firstMessage = firstMessage;
    }
    if (script !== undefined) {
      // VAAPI stores script in instructions field
      updatePayload.instructions = script;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const response = await fetch(`${VAPI_API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Failed to update assistant" },
        { status: response.status }
      );
    }

    const updatedAssistant = await response.json();

    return NextResponse.json({
      success: true,
      assistant: mapVapiAssistantToClient(updatedAssistant),
      message: "Assistant updated successfully",
    });
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

