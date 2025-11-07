import React, { useState } from "react";
import { History, ChevronDown, ChevronUp, Clock, Phone, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";

interface HistoryTabProps {
  callHistory: Candidate[];
  onSyncFromVapi?: () => void;
}

interface CallDetails {
  call_summary?: string;
  call_transcript?: string;
  call_duration?: number;
  call_analysis?: any;
  sentiment?: string;
  key_topics?: string[];
}

export function HistoryTab({ callHistory, onSyncFromVapi }: HistoryTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [callDetails, setCallDetails] = useState<Map<number, CallDetails>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());

  const toggleRow = (candidateId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
      // Load call details if not already loaded
      if (!callDetails.has(candidateId) && !loadingDetails.has(candidateId)) {
        loadCallDetails(candidateId);
      }
    }
    setExpandedRows(newExpanded);
  };

  const loadCallDetails = async (candidateId: number) => {
    setLoadingDetails(prev => new Set(prev).add(candidateId));
    try {
      const candidate = callHistory.find(c => c.id === candidateId);
      if (candidate?.vapi_call_id) {
        const response = await fetch(`/api/vapi-call?callId=${candidate.vapi_call_id}`);
        const result = await response.json();
        if (result.success && result.call) {
          setCallDetails(prev => new Map(prev).set(candidateId, {
            call_summary: result.call.summary,
            call_transcript: result.call.transcript,
            call_duration: result.call.duration,
            call_analysis: result.call.analysis,
            sentiment: result.call.sentiment,
            key_topics: result.call.topics
          }));
        }
      }
    } catch (error) {
      console.error("Error loading call details:", error);
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatEndedReason = (reason?: string) => {
    if (!reason) return "-";
    return reason
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCallType = (type?: string) => {
    if (!type) return "-";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getEndedReasonColor = (reason?: string) => {
    if (!reason) return "secondary";
    if (reason.includes("customer-ended") || reason.includes("completed")) return "default";
    if (reason.includes("not-answer") || reason.includes("timeout")) return "destructive";
    return "secondary";
  };

  const getSuccessEvaluationColor = (evaluation?: string) => {
    if (!evaluation) return "secondary";
    if (evaluation.toLowerCase() === "pass") return "default";
    if (evaluation.toLowerCase() === "fail") return "destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Call History ({callHistory.length})</span>
            </CardTitle>
            <CardDescription>
              Review completed calls and their results
            </CardDescription>
          </div>
          {onSyncFromVapi && (
            <Button onClick={onSyncFromVapi} variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Sync from VAPI
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {callHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No completed calls yet</h3>
            <p className="text-muted-foreground">Start making calls to see them here</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[120px]">CALL ID</TableHead>
                  <TableHead className="min-w-[150px]">ASSISTANT</TableHead>
                  <TableHead className="min-w-[150px]">ASSISTANT PHONE</TableHead>
                  <TableHead className="min-w-[150px]">CUSTOMER PHONE</TableHead>
                  <TableHead className="min-w-[100px]">TYPE</TableHead>
                  <TableHead className="min-w-[150px]">ENDED REASON</TableHead>
                  <TableHead className="min-w-[120px]">SUCCESS EVALUATION</TableHead>
                  <TableHead className="min-w-[80px]">SCORE</TableHead>
                  <TableHead className="min-w-[150px]">START TIME</TableHead>
                  <TableHead className="min-w-[100px]">DURATION</TableHead>
                  <TableHead className="min-w-[80px]">COST</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callHistory.map((candidate) => {
                  const isExpanded = expandedRows.has(candidate.id);
                  const details = callDetails.get(candidate.id);
                  const isLoading = loadingDetails.has(candidate.id);
                  
                  return (
                    <React.Fragment key={candidate.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(candidate.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {candidate.vapi_call_id ? `${candidate.vapi_call_id.substring(0, 10)}...` : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{candidate.assistant_name || "Unknown"}</span>
                            {candidate.assistant_id && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {candidate.assistant_id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {candidate.assistant_phone_number 
                            ? formatPhoneForDisplay(candidate.assistant_phone_number) 
                            : "-"}
                        </TableCell>
                        <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatCallType(candidate.call_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getEndedReasonColor(candidate.ended_reason)}>
                            {formatEndedReason(candidate.ended_reason)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {candidate.success_evaluation ? (
                            <Badge variant={getSuccessEvaluationColor(candidate.success_evaluation)}>
                              {candidate.success_evaluation.toUpperCase()}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{candidate.score || "N/A"}</TableCell>
                        <TableCell>
                          {candidate.call_start_time 
                            ? new Date(candidate.call_start_time).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {candidate.call_duration 
                            ? formatDuration(candidate.call_duration) 
                            : details?.call_duration 
                            ? formatDuration(details.call_duration) 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {candidate.call_cost !== undefined 
                            ? `$${candidate.call_cost.toFixed(2)}` 
                            : "$0.00"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${candidate.id}-details`}>
                          <TableCell colSpan={12} className="bg-muted/50 p-6">
                            {isLoading ? (
                              <div className="text-center py-4">Loading call details...</div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                      <Phone className="h-4 w-4" />
                                      Call Summary
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-background p-3 rounded border">
                                      {details?.call_summary || candidate.call_result || "No summary available"}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                      <Clock className="h-4 w-4" />
                                      Call Details
                                    </div>
                                    <div className="text-sm space-y-1 bg-background p-3 rounded border">
                                      <div><strong>Duration:</strong> {details?.call_duration ? formatDuration(details.call_duration) : 'N/A'}</div>
                                      {details?.sentiment && <div><strong>Sentiment:</strong> <Badge variant="outline">{details.sentiment}</Badge></div>}
                                      {candidate.call_start_time && <div><strong>Start:</strong> {new Date(candidate.call_start_time).toLocaleString()}</div>}
                                      {candidate.call_end_time && <div><strong>End:</strong> {new Date(candidate.call_end_time).toLocaleString()}</div>}
                                    </div>
                                  </div>
                                </div>
                                {details?.call_transcript && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                      <FileText className="h-4 w-4" />
                                      Full Transcript
                                    </div>
                                    <div className="text-sm bg-background p-4 rounded border max-h-64 overflow-y-auto">
                                      <pre className="whitespace-pre-wrap text-xs">{details.call_transcript}</pre>
                                    </div>
                                  </div>
                                )}
                                {candidate.call_notes && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                      <FileText className="h-4 w-4" />
                                      Notes
                                    </div>
                                    <div className="text-sm bg-background p-3 rounded border">
                                      {candidate.call_notes}
                                    </div>
                                  </div>
                                )}
                                {details?.key_topics && details.key_topics.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold">Key Topics</div>
                                    <div className="flex flex-wrap gap-2">
                                      {details.key_topics.map((topic, idx) => (
                                        <Badge key={idx} variant="secondary">{topic}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

