import { NextRequest, NextResponse } from "next/server";
import { 
  callQueueApi,
  callHistoryApi,
  supabase
} from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "queue";

  console.log(`[Calls API] GET request - type: ${type}`);

  try {
    if (type === "history") {
      console.log("[Calls API] Fetching call history...");
      const calls = await callHistoryApi.getHistory();
      console.log(`[Calls API] Call history fetched - count: ${calls.length}`, calls);
      return NextResponse.json({ calls });
    }

    console.log("[Calls API] Fetching call queue...");
    const queue = await callQueueApi.getQueue();
    console.log(`[Calls API] Call queue fetched - count: ${queue.length}`, queue);
    return NextResponse.json({ 
      queue,
      total: queue.length 
    });
  } catch (error) {
    console.error("[Calls API] Error fetching data:", error);
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
    
    console.log(`[Calls API] ===== POST REQUEST =====`);
    console.log(`[Calls API] Action: ${action}`);
    console.log(`[Calls API] Body keys:`, Object.keys(body));

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
        console.log(`[Calls API] Starting call for candidateId: ${candidateId}`);
        const queue = await callQueueApi.getQueue();
        console.log(`[Calls API] Current queue length: ${queue.length}`);
        const candidate = queue.find(c => c.id === candidateId);
        if (!candidate) {
          console.error(`[Calls API] Candidate ${candidateId} not found in queue`);
          return NextResponse.json({ error: "Candidate not found in queue" }, { status: 404 });
        }

        console.log(`[Calls API] Found candidate:`, candidate);
        // Update candidate status in Supabase
        console.log(`[Calls API] Updating candidate ${candidateId} status to 'calling'...`);
        const updateResult = await callQueueApi.updateStatus(candidateId, "calling");
        console.log(`[Calls API] Update result:`, updateResult);
        const updatedCandidate = { ...candidate, status: "calling" };

        return NextResponse.json({ 
          success: true, 
          candidate: updatedCandidate,
          message: "Call started"
        });

      case "end_call":
        console.log(`[Calls API] Ending call for candidateId: ${candidateId}`, { callResult, callNotes });
        const currentQueue = await callQueueApi.getQueue();
        console.log(`[Calls API] Current queue length: ${currentQueue.length}`);
        const candidateToUpdate = currentQueue.find(c => c.id === candidateId);
        if (!candidateToUpdate) {
          console.error(`[Calls API] Candidate ${candidateId} not found in queue`);
          return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        console.log(`[Calls API] Found candidate to update:`, candidateToUpdate);
        // Update candidate with call result and move to history
        console.log(`[Calls API] Updating candidate ${candidateId} status to 'completed'...`);
        const endCallResult = await callQueueApi.updateStatus(candidateId, "completed", {
          call_result: callResult,
          call_notes: callNotes
        });
        console.log(`[Calls API] End call update result:`, endCallResult);

        // Verify it's in history now
        const historyAfterUpdate = await callHistoryApi.getHistory();
        console.log(`[Calls API] History after update - count: ${historyAfterUpdate.length}`);
        const isInHistory = historyAfterUpdate.some(c => c.id === candidateId);
        console.log(`[Calls API] Candidate ${candidateId} is in history: ${isInHistory}`);

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

      case "check_call_status":
        // Check call status from VAPI and update if ended
        const { vapiCallId } = body;
        if (!vapiCallId) {
          return NextResponse.json({ error: "vapiCallId is required" }, { status: 400 });
        }
        
        console.log(`[Calls API] Checking call status for vapiCallId: ${vapiCallId}`);
        try {
          // Fetch call status from VAPI
          const vapiResponse = await fetch(`https://api.vapi.ai/call/${vapiCallId}`, {
            headers: {
              "Authorization": `Bearer ${process.env.VAPI_PRIVATE_KEY}`
            }
          });
          
          if (!vapiResponse.ok) {
            const error = await vapiResponse.json();
            console.error(`[Calls API] VAPI error:`, error);
            return NextResponse.json({ error: error.message || "Failed to get call status" }, { status: vapiResponse.status });
          }
          
          const callStatus = await vapiResponse.json();
          console.log(`[Calls API] Call status from VAPI:`, callStatus);
          
          // If call is ended, update the candidate
          if (callStatus.status === "ended" || callStatus.endedAt) {
            console.log(`[Calls API] Call is ended, updating candidate...`);
            
            if (!supabase) {
              console.error(`[Calls API] Supabase not configured`);
              return NextResponse.json({ error: "Database not configured" }, { status: 500 });
            }
            
            // Find candidate by vapi_call_id
            const { data: candidates, error: queryError } = await supabase
              .from('candidates')
              .select('id')
              .eq('vapi_call_id', vapiCallId)
              .limit(1);
            
            if (queryError) {
              console.error(`[Calls API] Error querying candidates:`, queryError);
              return NextResponse.json({ error: "Failed to query database" }, { status: 500 });
            }
            
            if (candidates && candidates.length > 0) {
              const candidateId = candidates[0].id;
              console.log(`[Calls API] Found candidate ${candidateId}, updating to completed...`);
              
              await callQueueApi.updateStatus(candidateId, "completed", {
                call_result: callStatus.summary || 'Call completed',
                call_notes: callStatus.transcript ? callStatus.transcript.substring(0, 500) : undefined
              });
              
              return NextResponse.json({ 
                success: true, 
                message: "Call status updated to completed",
                callStatus: callStatus.status
              });
            } else {
              console.error(`[Calls API] No candidate found with vapi_call_id: ${vapiCallId}`);
              return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
            }
          } else {
            return NextResponse.json({ 
              success: true, 
              message: "Call is still in progress",
              callStatus: callStatus.status
            });
          }
        } catch (error) {
          console.error(`[Calls API] Error checking call status:`, error);
          return NextResponse.json({ error: "Failed to check call status" }, { status: 500 });
        }

      case "sync_calls_from_vapi":
        // Sync all active calls from VAPI and update status
        console.log(`[Calls API] Syncing calls from VAPI...`);
        
        if (!supabase) {
          return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        if (!process.env.VAPI_PRIVATE_KEY) {
          return NextResponse.json({ error: "VAPI_PRIVATE_KEY not configured" }, { status: 500 });
        }

        try {
          // Get all candidates that are still in "calling" status with vapi_call_id
          // First, try to select with vapi_call_id
          const { data: activeCalls, error: activeCallsError } = await supabase
            .from('candidates')
            .select('id, vapi_call_id, phone, name')
            .eq('status', 'calling');

          if (activeCallsError) {
            // If error is about missing column, provide helpful message
            if (activeCallsError.code === '42703' && activeCallsError.message.includes('vapi_call_id')) {
              console.error(`[Calls API] vapi_call_id column doesn't exist in database`);
              return NextResponse.json({ 
                success: false, 
                error: "vapi_call_id column not found in database. Please add it to the candidates table first.",
                hint: "Run this SQL: ALTER TABLE candidates ADD COLUMN IF NOT EXISTS vapi_call_id TEXT;"
              }, { status: 400 });
            } else {
              console.error(`[Calls API] Error fetching active calls:`, activeCallsError);
              return NextResponse.json({ error: "Failed to fetch active calls" }, { status: 500 });
            }
          }

          // Filter out candidates without vapi_call_id
          const candidatesWithCallId = (activeCalls || []).filter((c: any) => c.vapi_call_id);

          if (!candidatesWithCallId || candidatesWithCallId.length === 0) {
            console.log(`[Calls API] No active calls with vapi_call_id to sync`);
            return NextResponse.json({ 
              success: true, 
              message: "No active calls with vapi_call_id to sync",
              updated: 0,
              checked: activeCalls?.length || 0
            });
          }

          console.log(`[Calls API] Found ${candidatesWithCallId.length} active calls with vapi_call_id to check`);
          let updatedCount = 0;

          // Check each call status from VAPI
          for (const candidate of candidatesWithCallId) {
            if (!candidate.vapi_call_id) continue;

            try {
              const vapiResponse = await fetch(`https://api.vapi.ai/call/${candidate.vapi_call_id}`, {
                headers: {
                  "Authorization": `Bearer ${process.env.VAPI_PRIVATE_KEY}`
                }
              });

              if (!vapiResponse.ok) {
                console.error(`[Calls API] Failed to fetch call ${candidate.vapi_call_id}:`, vapiResponse.status);
                continue;
              }

              const callData = await vapiResponse.json();
              console.log(`[Calls API] Call ${candidate.vapi_call_id} status:`, callData.status);

              // If call is ended, update the candidate with all VAPI data
              if (callData.status === "ended" || callData.endedAt) {
                console.log(`[Calls API] Updating candidate ${candidate.id} to completed...`);
                
                await callQueueApi.updateStatus(candidate.id, "completed", {
                  call_result: callData.summary || `Call ended: ${callData.endedReason || 'Unknown'}`,
                  call_notes: callData.transcript ? callData.transcript.substring(0, 500) : undefined,
                  call_end_time: callData.endedAt || new Date().toISOString(),
                  // VAPI call log fields
                  assistant_name: callData.assistant?.name,
                  assistant_id: callData.assistant?.id,
                  assistant_phone_number: callData.phoneNumber?.number || callData.assistantPhoneNumber,
                  call_type: callData.type || (callData.customer?.number ? "outbound" : "web"),
                  ended_reason: callData.endedReason,
                  success_evaluation: callData.successEvaluation || (callData.endedReason === "customer-ended-call" ? "pass" : undefined),
                  score: callData.score,
                  call_duration: callData.duration,
                  call_cost: callData.cost
                });

                updatedCount++;
                console.log(`[Calls API] Successfully updated candidate ${candidate.id}`);
              }
            } catch (error) {
              console.error(`[Calls API] Error checking call ${candidate.vapi_call_id}:`, error);
              continue;
            }
          }

          return NextResponse.json({ 
            success: true, 
            message: `Synced ${activeCalls.length} calls, updated ${updatedCount} to completed`,
            checked: activeCalls.length,
            updated: updatedCount
          });

        } catch (error) {
          console.error(`[Calls API] Error syncing calls:`, error);
          return NextResponse.json({ error: "Failed to sync calls" }, { status: 500 });
        }

      case "import_calls_from_vapi":
        // Import historical calls from VAPI using /logs endpoint
        console.log(`[Calls API] Importing calls from VAPI using /logs endpoint...`);
        
        if (!supabase) {
          return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        if (!process.env.VAPI_PRIVATE_KEY) {
          return NextResponse.json({ error: "VAPI_PRIVATE_KEY not configured" }, { status: 500 });
        }

        try {
          // Fetch call logs from VAPI /logs endpoint
          const { limit = 100, offset = 0 } = body;
          console.log(`[Calls API] ===== FETCHING FROM VAPI /logs ENDPOINT =====`);
          console.log(`[Calls API] URL: https://api.vapi.ai/logs?limit=${limit}&offset=${offset}`);
          console.log(`[Calls API] Has VAPI_PRIVATE_KEY: ${!!process.env.VAPI_PRIVATE_KEY}`);
          
          const logsUrl = `https://api.vapi.ai/logs?limit=${limit}&offset=${offset}`;
          console.log(`[Calls API] Making request to VAPI /logs endpoint...`);
          
          const logsResponse = await fetch(logsUrl, {
            headers: {
              "Authorization": `Bearer ${process.env.VAPI_PRIVATE_KEY}`
            }
          });

          console.log(`[Calls API] VAPI /logs response status: ${logsResponse.status}`);
          console.log(`[Calls API] VAPI /logs response ok: ${logsResponse.ok}`);

          if (!logsResponse.ok) {
            let errorData;
            try {
              errorData = await logsResponse.json();
            } catch (e) {
              // If response is not JSON, get text
              const errorText = await logsResponse.text();
              errorData = { message: errorText || "Unknown error" };
            }
            
            console.error(`[Calls API] VAPI /logs error:`, JSON.stringify(errorData, null, 2));
            console.error(`[Calls API] Response status: ${logsResponse.status}`);
            console.error(`[Calls API] Response headers:`, Object.fromEntries(logsResponse.headers.entries()));
            
            // If /logs endpoint doesn't exist (404) or returns error, return helpful message
            // Don't return 400 - let the sync continue with individual calls
            return NextResponse.json({ 
              success: false,
              error: "VAPI /logs endpoint not available or returned error",
              fallback: "Use sync_calls_from_vapi action instead",
              details: errorData.message || errorData.error || "Unknown error",
              status: logsResponse.status
            }, { status: 200 }); // Return 200 so sync can continue
          }

          const logsData = await logsResponse.json();
          console.log(`[Calls API] VAPI /logs response data keys:`, Object.keys(logsData));
          console.log(`[Calls API] VAPI /logs response sample:`, JSON.stringify(logsData).substring(0, 500));
          
          const calls = logsData.calls || logsData.data || logsData || [];
          
          console.log(`[Calls API] ===== SUCCESS: Fetched ${calls.length} calls from VAPI /logs endpoint =====`);

          if (!calls || calls.length === 0) {
            return NextResponse.json({ 
              success: true, 
              message: "No calls found in VAPI logs",
              matched: 0,
              updated: 0
            });
          }

          // Get all candidates from database
          const { data: allCandidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('id, phone, name, vapi_call_id, status');

          if (candidatesError) {
            console.error(`[Calls API] Error fetching candidates:`, candidatesError);
            return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
          }

          if (!allCandidates || allCandidates.length === 0) {
            return NextResponse.json({ 
              success: true, 
              message: "No candidates to match with VAPI calls",
              matched: 0,
              updated: 0,
              callsFound: calls.length
            });
          }

          console.log(`[Calls API] Found ${allCandidates.length} candidates to match with ${calls.length} VAPI calls`);

          let matchedCount = 0;
          let updatedCount = 0;
          let createdCount = 0;

          // Match calls with candidates by phone number or metadata
          for (const call of calls) {
            try {
              // Skip if call is not ended
              if (call.status !== "ended" && !call.endedAt) {
                continue;
              }

              // Try to find candidate by phone number
              const customerPhone = call.customer?.number || call.phoneNumber;
              if (!customerPhone) continue;

              // Normalize phone number for matching
              const normalizedCallPhone = customerPhone.replace(/[^\d+]/g, '');
              
              // Find matching candidate
              let candidate = allCandidates.find(c => {
                const normalizedCandidatePhone = c.phone.replace(/[^\d+]/g, '');
                return normalizedCandidatePhone === normalizedCallPhone || 
                       normalizedCandidatePhone === customerPhone ||
                       c.phone === customerPhone;
              });

              // Also try matching by metadata candidateId
              if (!candidate && call.metadata?.candidateId) {
                const candidateId = parseInt(call.metadata.candidateId);
                if (!isNaN(candidateId)) {
                  candidate = allCandidates.find(c => c.id === candidateId);
                }
              }

              // Try matching by vapi_call_id if we have it stored
              if (!candidate && call.id) {
                candidate = allCandidates.find(c => c.vapi_call_id === call.id);
              }

              if (candidate) {
                // Update existing candidate
                const updateData = {
                  vapi_call_id: call.id,
                  status: 'completed',
                  call_result: call.summary || `Call ended: ${call.endedReason || 'Unknown'}`,
                  call_notes: call.transcript ? call.transcript.substring(0, 500) : undefined,
                  call_end_time: call.endedAt || call.endedAt || new Date().toISOString(),
                  call_start_time: call.startedAt || call.createdAt,
                  // VAPI call log fields
                  assistant_name: call.assistant?.name,
                  assistant_id: call.assistant?.id,
                  assistant_phone_number: call.phoneNumber?.number || call.assistantPhoneNumber,
                  call_type: call.type || (call.customer?.number ? "outbound" : "web"),
                  ended_reason: call.endedReason,
                  success_evaluation: call.successEvaluation,
                  score: call.score,
                  call_duration: call.duration,
                  call_cost: call.cost
                };

                await callQueueApi.updateStatus(candidate.id, "completed", updateData);
                matchedCount++;
                if (candidate.status !== 'completed' || !candidate.vapi_call_id) {
                  updatedCount++;
                }
                console.log(`[Calls API] Matched and updated candidate ${candidate.id} with call ${call.id}`);
              } else {
                // Optionally create new candidate from call data if not found
                // This allows importing calls that weren't in your database
                console.log(`[Calls API] Call ${call.id} to ${customerPhone} not matched with any candidate`);
              }
            } catch (error) {
              console.error(`[Calls API] Error processing call ${call.id}:`, error);
              continue;
            }
          }

          return NextResponse.json({ 
            success: true, 
            message: `Imported calls from VAPI: ${matchedCount} calls matched, ${updatedCount} records updated`,
            matched: matchedCount,
            updated: updatedCount,
            created: createdCount,
            callsFound: calls.length
          });

        } catch (error) {
          console.error(`[Calls API] Error importing calls:`, error);
          return NextResponse.json({ error: "Failed to import calls" }, { status: 500 });
        }

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
