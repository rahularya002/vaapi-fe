import { Phone, Upload, Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";

interface QueueTabProps {
  callQueue: Candidate[];
  isCalling: boolean;
  currentCall: Candidate | null;
  onSetActiveTab: (tab: string) => void;
  onStartCall: (candidate: Candidate) => void;
  onClearQueue: () => void;
}

export function QueueTab({ 
  callQueue, 
  isCalling, 
  currentCall, 
  onSetActiveTab, 
  onStartCall, 
  onClearQueue 
}: QueueTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Call Queue ({callQueue.length})</span>
            </CardTitle>
            <CardDescription>
              Manage your call queue and start automated calls
            </CardDescription>
          </div>
          {callQueue.length > 0 && (
            <Button variant="destructive" onClick={onClearQueue}>
              <Square className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {callQueue.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates in queue</h3>
            <p className="text-muted-foreground mb-4">Add candidates from the upload tab to get started</p>
            <Button onClick={() => onSetActiveTab("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Candidates
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callQueue.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                      <TableCell>{candidate.position}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            candidate.status === "pending" ? "secondary" :
                            candidate.status === "calling" ? "default" : "outline"
                          }
                        >
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStartCall(candidate)}
                          disabled={isCalling || candidate.status === "calling"}
                        >
                          {isCalling && currentCall?.id === candidate.id ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Calling...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start Call
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
