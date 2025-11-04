import { Upload, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";

interface UploadTabProps {
  isLoading: boolean;
  isUploading: boolean;
  candidates: Candidate[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddToCallQueue: () => void;
}

export function UploadTab({ 
  isLoading, 
  isUploading, 
  candidates, 
  onFileUpload, 
  onAddToCallQueue 
}: UploadTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Upload Candidate Data</span>
        </CardTitle>
        <CardDescription>
          Upload an Excel file with candidate information to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Excel File (.xlsx, .xls)</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileUpload}
            disabled={isUploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 h-14"
          />
          {isUploading && (
            <div className="space-y-2">
              <Progress value={33} className="w-full" />
              <p className="text-sm text-muted-foreground">Uploading and parsing file...</p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading candidates...</span>
            </div>
          </div>
        ) : candidates.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parsed Candidates ({candidates.length})</h3>
              <Button onClick={onAddToCallQueue} className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Add All to Queue</span>
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.slice(0, 10).map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell>{formatPhoneForDisplay(candidate.phone)}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>{candidate.position}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {candidates.length > 10 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  ... and {candidates.length - 10} more candidates
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No candidates uploaded yet</p>
            <p className="text-sm">Upload an Excel file to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
