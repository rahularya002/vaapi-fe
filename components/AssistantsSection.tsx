"use client";

import { useState, useEffect } from "react";
import { Bot, Loader2, Edit, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Assistant {
  id: string;
  name: string;
  description?: string;
  status: "active" | "idle";
  firstMessage?: string;
  script?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function AssistantsSection() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [firstMessage, setFirstMessage] = useState("");
  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/assistants");
      const result = await response.json();
      if (result.success) {
        setAssistants(result.assistants || []);
      } else {
        toast.error("Failed to load assistants", {
          description: result.error || "An error occurred while loading assistants",
        });
      }
    } catch (error) {
      console.error("Error loading assistants:", error);
      toast.error("Failed to load assistants", {
        description: "An error occurred while loading assistants",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setFirstMessage(assistant.firstMessage || "");
    setScript(assistant.script || "");
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedAssistant) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/assistants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAssistant.id,
          firstMessage,
          script,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Assistant updated", {
          description: "The assistant has been updated successfully",
        });
        setIsEditDialogOpen(false);
        await loadAssistants();
      } else {
        toast.error("Update failed", {
          description: result.error || "Failed to update assistant",
        });
      }
    } catch (error) {
      console.error("Error updating assistant:", error);
      toast.error("Update failed", {
        description: "An error occurred while updating the assistant",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge variant="default" className="gap-1.5">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Circle className="h-3 w-3" />
        Idle
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>AI Assistants</span>
              </CardTitle>
              <CardDescription>
                Manage your AI calling assistants and their configurations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading assistants...</span>
              </div>
            </div>
          ) : assistants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-1">No assistants found</p>
              <p className="text-sm">Assistants will appear here once created</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assistants.map((assistant) => (
                    <TableRow key={assistant.id}>
                      <TableCell className="font-medium">{assistant.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {assistant.description || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(assistant.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assistant)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
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

      {/* Edit Assistant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Edit Assistant: {selectedAssistant?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Update the first message and conversation script for this assistant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* First Message */}
            <div className="space-y-2">
              <Label htmlFor="first-message">
                First Message <span className="text-muted-foreground text-sm">(Opening line)</span>
              </Label>
              <Textarea
                id="first-message"
                placeholder="Enter the opening message the assistant will use..."
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This is the first thing the assistant will say when a call starts
              </p>
            </div>

            {/* Script */}
            <div className="space-y-2">
              <Label htmlFor="script">
                Script <span className="text-muted-foreground text-sm">(Conversation script)</span>
              </Label>
              <Textarea
                id="script"
                placeholder="Enter the detailed conversation script and instructions..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Define how the assistant should behave, what questions to ask, and how to handle responses
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

