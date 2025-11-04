import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
	// Optional simple bearer token check to prevent random posts
	const authHeader = request.headers.get("authorization") || "";
	const expected = process.env.WEBHOOK_SECRET;
	if (expected) {
		const provided = authHeader.replace(/^Bearer\s+/i, "");
		if (!provided || provided !== expected) {
			return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
		}
	}
	
	try {
		const body = await request.json();
		console.log("[Vapi Webhook] Event:", {
			type: body?.type,
			callId: body?.callId,
			dataKeys: body ? Object.keys(body) : [],
		});

		// Handle different webhook events
		switch (body?.type) {
			case "call-started":
				await handleCallStarted(body);
				break;
			case "call-ended":
				await handleCallEnded(body);
				break;
			case "assistant-message":
				await handleAssistantMessage(body);
				break;
			case "user-message":
				await handleUserMessage(body);
				break;
			case "function-call":
				await handleFunctionCall(body);
				break;
			case "call-analysis":
				await handleCallAnalysis(body);
				break;
			default:
				console.log("[Vapi Webhook] Unhandled event type:", body?.type);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Vapi Webhook] Error parsing body", error);
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}
}

async function handleCallStarted(event: any) {
	console.log("[Vapi Webhook] Call started:", event.callId);
	
	if (supabase && event.callId) {
		try {
			// Update calls table if it exists
			await supabase
				.from('calls')
				.update({ 
					status: 'calling',
					call_start_time: new Date().toISOString(),
					vapi_call_id: event.callId
				})
				.eq('vapi_call_id', event.callId);

			// Also update candidate status if found
			const { data: candidates } = await supabase
				.from('candidates')
				.select('id')
				.eq('vapi_call_id', event.callId)
				.limit(1);

			if (candidates && candidates.length > 0) {
				await supabase
					.from('candidates')
					.update({
						status: 'calling',
						call_start_time: new Date().toISOString()
					})
					.eq('id', candidates[0].id);
			}
		} catch (error) {
			console.error("Error updating call status:", error);
		}
	}
}

async function handleCallEnded(event: any) {
	console.log("[Vapi Webhook] Call ended:", event.callId);
	
	if (supabase && event.callId) {
		try {
			// Update calls table
			await supabase
				.from('calls')
				.update({ 
					status: 'completed',
					call_end_time: new Date().toISOString(),
					call_duration: event.duration,
					call_summary: event.summary,
					call_transcript: event.transcript
				})
				.eq('vapi_call_id', event.callId);

			// Find and update candidate status by vapi_call_id
			const { data: candidates } = await supabase
				.from('candidates')
				.select('id')
				.eq('vapi_call_id', event.callId)
				.limit(1);

			if (candidates && candidates.length > 0) {
				const candidateId = candidates[0].id;
				
				// Update candidate status to completed
				await supabase
					.from('candidates')
					.update({
						status: 'completed',
						call_end_time: new Date().toISOString(),
						call_result: event.summary || 'Completed',
						call_notes: event.transcript ? event.transcript.substring(0, 500) : undefined, // Truncate long transcripts
						call_time: new Date().toISOString()
					})
					.eq('id', candidateId);

				console.log(`[Vapi Webhook] Updated candidate ${candidateId} status to completed`);
			} else {
				console.log(`[Vapi Webhook] No candidate found with vapi_call_id: ${event.callId}`);
				
				// Try to find by phone number from metadata
				if (event.metadata?.phoneNumber || event.customer?.number) {
					const phoneNumber = event.metadata?.phoneNumber || event.customer?.number;
					const { data: candidateByPhone } = await supabase
						.from('candidates')
						.select('id')
						.eq('phone', phoneNumber)
						.eq('status', 'calling')
						.limit(1);

					if (candidateByPhone && candidateByPhone.length > 0) {
						const candidateId = candidateByPhone[0].id;
						await supabase
							.from('candidates')
							.update({
								status: 'completed',
								call_end_time: new Date().toISOString(),
								call_result: event.summary || 'Completed',
								call_notes: event.transcript ? event.transcript.substring(0, 500) : undefined,
								call_time: new Date().toISOString(),
								vapi_call_id: event.callId
							})
							.eq('id', candidateId);
						console.log(`[Vapi Webhook] Updated candidate ${candidateId} by phone number`);
					}
				}
			}
		} catch (error) {
			console.error("Error updating call end status:", error);
		}
	}
}

async function handleAssistantMessage(event: any) {
	console.log("[Vapi Webhook] Assistant message:", event.message);
	// Log assistant responses for debugging
}

async function handleUserMessage(event: any) {
	console.log("[Vapi Webhook] User message:", event.message);
	// Log user responses for debugging
}

async function handleFunctionCall(event: any) {
	console.log("[Vapi Webhook] Function call:", event.functionCall);
	
	// Handle specific function calls from the assistant
	if (event.functionCall?.name === "take_notes") {
		await handleTakeNotes(event.functionCall.parameters, event.callId);
	} else if (event.functionCall?.name === "collect_candidate_info") {
		await handleCollectCandidateInfo(event.functionCall.parameters, event.callId);
	} else if (event.functionCall?.name === "schedule_follow_up") {
		await handleScheduleFollowUp(event.functionCall.parameters, event.callId);
	}
}

async function handleCallAnalysis(event: any) {
	console.log("[Vapi Webhook] Call analysis:", event.analysis);
	
	// Save call analysis results
	if (supabase && event.callId) {
		try {
			await supabase
				.from('calls')
				.update({ 
					call_analysis: event.analysis,
					sentiment: event.analysis?.sentiment,
					key_topics: event.analysis?.topics
				})
				.eq('vapi_call_id', event.callId);
		} catch (error) {
			console.error("Error saving call analysis:", error);
		}
	}
}

async function handleCollectCandidateInfo(parameters: any, callId: string) {
	console.log("[Vapi Webhook] Collecting candidate info:", parameters);
	
	if (supabase && callId) {
		try {
			// Find candidate by vapi_call_id
			const { data: candidates } = await supabase
				.from('candidates')
				.select('id, call_notes')
				.eq('vapi_call_id', callId)
				.limit(1);

			if (candidates && candidates.length > 0) {
				const candidateId = candidates[0].id;
				const candidate = candidates[0];
				
				// Update candidate with collected information
				const updateData: any = {
					updated_at: new Date().toISOString()
				};

				// Update name if provided
				if (parameters.candidate_name) {
					updateData.name = parameters.candidate_name;
				}

				// Update email if provided
				if (parameters.email) {
					updateData.email = parameters.email;
				}

				// Update position if provided
				if (parameters.position) {
					updateData.position = parameters.position;
				}

				// Update phone if provided (if different or confirmed)
				if (parameters.phone) {
					updateData.phone = parameters.phone;
				}

				// Save additional_info to call_notes or as JSON
				if (parameters.additional_info) {
					// Append additional info to call_notes as structured data
					const existingNotes = candidate.call_notes || '';
					const additionalInfoText = JSON.stringify(parameters.additional_info, null, 2);
					updateData.call_notes = existingNotes 
						? `${existingNotes}\n\nAdditional Info:\n${additionalInfoText}`
						: `Additional Info:\n${additionalInfoText}`;
				}

				await supabase
					.from('candidates')
					.update(updateData)
					.eq('id', candidateId);

				console.log(`[Vapi Webhook] Updated candidate ${candidateId} with collected information`);
			} else {
				// Try to find by phone number if candidate not found by call_id
				console.log(`[Vapi Webhook] Candidate not found by call_id, trying to create/update by phone`);
				// This could be a new candidate or we need to find by phone
			}
		} catch (error) {
			console.error("Error saving candidate info:", error);
		}
	}
}

async function handleTakeNotes(parameters: any, callId: string) {
	console.log("[Vapi Webhook] Taking notes:", parameters);
	
	if (supabase && callId) {
		try {
			// Save notes to call_notes table
			await supabase
				.from('call_notes')
				.insert({
					call_id: callId,
					question: parameters.question,
					response: parameters.response,
					key_points: parameters.key_points,
					created_at: new Date().toISOString()
				});

			// Also update candidate's call_notes field with the note
			const { data: candidates } = await supabase
				.from('candidates')
				.select('id, call_notes')
				.eq('vapi_call_id', callId)
				.limit(1);

			if (candidates && candidates.length > 0) {
				const candidateId = candidates[0].id;
				const existingNotes = candidates[0].call_notes || '';
				
				// Format the note
				const noteText = `Q: ${parameters.question}\nA: ${parameters.response}${parameters.key_points ? `\nKey Points: ${parameters.key_points.join(', ')}` : ''}`;
				
				// Append to existing notes
				const updatedNotes = existingNotes 
					? `${existingNotes}\n\n${noteText}`
					: noteText;

				await supabase
					.from('candidates')
					.update({
						call_notes: updatedNotes,
						updated_at: new Date().toISOString()
					})
					.eq('id', candidateId);

				console.log(`[Vapi Webhook] Updated candidate ${candidateId} with note`);
			}
		} catch (error) {
			console.error("Error saving notes:", error);
		}
	}
}

async function handleScheduleFollowUp(parameters: any, callId: string) {
	console.log("[Vapi Webhook] Scheduling follow-up:", parameters);
	
	// Save follow-up request to database
	if (supabase && callId) {
		try {
			await supabase
				.from('follow_ups')
				.insert({
					call_id: callId,
					candidate_name: parameters.candidate_name,
					preferred_time: parameters.preferred_time,
					reason: parameters.reason,
					status: 'pending',
					created_at: new Date().toISOString()
				});
		} catch (error) {
			console.error("Error saving follow-up:", error);
		}
	}
}

export function GET() {
	return NextResponse.json({ status: "vapi-webhook-ok" });
}


