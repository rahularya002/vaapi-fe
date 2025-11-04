import { NextRequest, NextResponse } from "next/server";
import { 
  callQueueApi,
  callHistoryApi
} from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "queue";

  try {
    if (type === "history") {
      const calls = await callHistoryApi.getHistory();
      return NextResponse.json({ calls });
    }

    const queue = await callQueueApi.getQueue();
    return NextResponse.json({ 
      queue,
      total: queue.length 
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, candidateId, callResult, callNotes } = body;

    switch (action) {
      case "add_to_queue":
        const { candidates } = body;
        if (!Array.isArray(candidates)) {
          return NextResponse.json({ error: "Candidates must be an array" }, { status: 400 });
        }
        
        // Add candidates to queue with Supabase
        await callQueueApi.addToQueue(candidates);
        const updatedQueue = await callQueueApi.getQueue();
        
        return NextResponse.json({ 
          success: true, 
          message: `Added ${candidates.length} candidates to call queue`,
          queueLength: updatedQueue.length
        });

      case "start_call":
        const queue = await callQueueApi.getQueue();
        const candidate = queue.find(c => c.id === candidateId);
        if (!candidate) {
          return NextResponse.json({ error: "Candidate not found in queue" }, { status: 404 });
        }

        // Update candidate status in Supabase
        await callQueueApi.updateStatus(candidateId, "calling");
        const updatedCandidate = { ...candidate, status: "calling" };

        return NextResponse.json({ 
          success: true, 
          candidate: updatedCandidate,
          message: "Call started"
        });

      case "end_call":
        const currentQueue = await callQueueApi.getQueue();
        const candidateToUpdate = currentQueue.find(c => c.id === candidateId);
        if (!candidateToUpdate) {
          return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        // Update candidate with call result and move to history
        await callQueueApi.updateStatus(candidateId, "completed", {
          call_result: callResult,
          call_notes: callNotes
        });

        return NextResponse.json({ 
          success: true, 
          message: "Call completed and moved to history"
        });

      case "clear_queue":
        await callQueueApi.clearQueue();
        return NextResponse.json({ 
          success: true, 
          message: "Call queue cleared"
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in call management:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
