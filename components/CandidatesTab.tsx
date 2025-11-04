import { Users, Upload, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";

interface CandidatesTabProps {
  candidates: Candidate[];
  isCalling: boolean;
  currentCall: Candidate | null;
  onSetActiveTab: (tab: string) => void;
  onStartCall: (candidate: Candidate) => void;
}

export function CandidatesTab({ 
  candidates, 
  isCalling, 
  currentCall, 
  onSetActiveTab, 
  onStartCall 
}: CandidatesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>All Candidates ({candidates.length})</span>
        </CardTitle>
        <CardDescription>
          Manage and review all uploaded candidates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates uploaded</h3>
            <p className="text-muted-foreground mb-4">Upload an Excel file to get started</p>
            <Button onClick={() => onSetActiveTab("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell>{candidate.position}</TableCell>
                    <TableCell>
                      <Badge variant={candidate.status === "completed" ? "default" : "secondary"}>
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
                            Call Now
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
