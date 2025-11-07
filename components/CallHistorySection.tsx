"use client";

import { useState } from "react";
import { History, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";

interface CallHistorySectionProps {
  callHistory: Candidate[];
  onExportCSV?: () => void;
  onSyncFromVapi?: () => void;
}

export function CallHistorySection({
  callHistory,
  onExportCSV,
  onSyncFromVapi,
}: CallHistorySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = callHistory.filter((call) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      call.name?.toLowerCase().includes(searchLower) ||
      call.phone?.includes(searchQuery) ||
      call.call_result?.toLowerCase().includes(searchLower) ||
      call.assistant_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getOutcomeBadge = (call: Candidate) => {
    if (call.success_evaluation) {
      return (
        <Badge
          variant={call.success_evaluation.toLowerCase() === "pass" ? "default" : "destructive"}
        >
          {call.success_evaluation.toUpperCase()}
        </Badge>
      );
    }
    if (call.ended_reason) {
      if (call.ended_reason.includes("completed") || call.ended_reason.includes("customer-ended")) {
        return <Badge variant="default">Completed</Badge>;
      }
      if (call.ended_reason.includes("not-answer") || call.ended_reason.includes("timeout")) {
        return <Badge variant="destructive">Failed</Badge>;
      }
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Call History ({filteredHistory.length})</span>
              </CardTitle>
              <CardDescription>
                Review completed calls and their results
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {onSyncFromVapi && (
                <Button variant="outline" size="sm" onClick={onSyncFromVapi}>
                  Sync
                </Button>
              )}
              {onExportCSV && (
                <Button variant="outline" size="sm" onClick={onExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by lead, number, outcome, agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No call history found</p>
              <p className="text-sm">Start making calls to see them here</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.name || "-"}</TableCell>
                      <TableCell>{formatPhoneForDisplay(call.phone)}</TableCell>
                      <TableCell>{getOutcomeBadge(call)}</TableCell>
                      <TableCell>{formatDuration(call.call_duration)}</TableCell>
                      <TableCell>
                        {call.assistant_name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(call.call_start_time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

