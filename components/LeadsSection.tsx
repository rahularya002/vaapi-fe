"use client";

import { useState, useEffect, useMemo } from "react";
import { Upload, Plus, Search, Filter, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeadsSectionProps {
  isLoading: boolean;
  isUploading: boolean;
  candidates: Candidate[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddLead: (lead: { name: string; email: string; phone: string; tags: string[] }) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function LeadsSection({
  isLoading,
  isUploading,
  candidates,
  onFileUpload,
  onAddLead,
  onRefresh,
}: LeadsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [deduplicate, setDeduplicate] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", tags: "" });
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique tags from candidates
  const allTags = Array.from(
    new Set(
      candidates
        .map((c) => c.position)
        .filter(Boolean)
        .flatMap((p) => p.split(",").map((t) => t.trim()))
    )
  );

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.phone.includes(searchQuery);
      
      const matchesTag = selectedTag === "all" || candidate.position?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [candidates, searchQuery, selectedTag]);

  // Deduplicate by phone number if enabled
  const displayCandidates = useMemo(() => {
    return deduplicate
      ? Array.from(
          new Map(filteredCandidates.map((c) => [c.phone, c])).values()
        )
      : filteredCandidates;
  }, [filteredCandidates, deduplicate]);

  // Update selected leads when filtered candidates change
  useEffect(() => {
    const filteredIds = new Set(displayCandidates.map((c) => c.id));
    setSelectedLeadIds((prev) => {
      const updated = new Set<number>();
      prev.forEach((id) => {
        if (filteredIds.has(id)) {
          updated.add(id);
        }
      });
      // Only update if there's actually a change
      if (updated.size === prev.size && Array.from(updated).every(id => prev.has(id))) {
        return prev;
      }
      return updated;
    });
  }, [displayCandidates]);

  const handleAddLead = async () => {
    const tags = newLead.tags.split(",").map((t) => t.trim()).filter(Boolean);
    await onAddLead({
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      tags,
    });
    setNewLead({ name: "", email: "", phone: "", tags: "" });
    setIsDialogOpen(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(displayCandidates.map((c) => c.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleSelectLead = (leadId: number, checked: boolean) => {
    setSelectedLeadIds((prev) => {
      const updated = new Set(prev);
      if (checked) {
        updated.add(leadId);
      } else {
        updated.delete(leadId);
      }
      return updated;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedLeadIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_candidates",
          candidateIds: Array.from(selectedLeadIds),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Leads deleted", {
          description: `${selectedLeadIds.size} lead(s) deleted successfully`,
        });
        setSelectedLeadIds(new Set());
        setIsDeleteDialogOpen(false);
        // Refresh the data
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        toast.error("Delete failed", {
          description: result.error || "Failed to delete leads",
        });
      }
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast.error("Delete failed", {
        description: "An error occurred while deleting leads",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = displayCandidates.length > 0 && selectedLeadIds.size === displayCandidates.length;

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload CSV</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with lead information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Select File
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileUpload}
              disabled={isUploading}
              className="h-14 cursor-pointer p-2 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:transition-colors"
            />
            {isUploading && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Uploading and parsing file...</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV, XLSX, XLS
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:min-w-[240px]">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag-filter" className="text-sm font-medium">Tag</Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger id="tag-filter" className="h-9">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2 pt-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="deduplicate" className="text-sm font-medium">
                    Deduplicate
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Remove duplicates by phone
                  </p>
                </div>
                <Switch
                  id="deduplicate"
                  checked={deduplicate}
                  onCheckedChange={setDeduplicate}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Leads</span>
                    {displayCandidates.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {displayCandidates.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage and view all your leads
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Lead</DialogTitle>
                      <DialogDescription>
                        Enter the lead information below. All fields marked with * are required.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={newLead.name}
                          onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={newLead.email}
                          onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+1234567890"
                          value={newLead.phone}
                          onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags" className="text-sm font-medium">
                          Tags <span className="text-muted-foreground text-xs">(comma-separated)</span>
                        </Label>
                        <Input
                          id="tags"
                          placeholder="tag1, tag2, tag3"
                          value={newLead.tags}
                          onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddLead}>
                          Add Lead
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading leads...</span>
                  </div>
                </div>
              ) : displayCandidates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-1">No leads found</p>
                  <p className="text-sm">Upload a CSV file or add a lead to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Delete Selected Button */}
                  {selectedLeadIds.size > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <span className="text-sm font-medium">
                        {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? "s" : ""} selected
                      </span>
                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Selected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Selected Leads?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? "s" : ""}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteSelected();
                              }}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {/* Table */}
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-11 w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all leads"
                            />
                          </TableHead>
                          <TableHead className="h-11">Name</TableHead>
                          <TableHead className="h-11">Email</TableHead>
                          <TableHead className="h-11">Phone</TableHead>
                          <TableHead className="h-11">Tags</TableHead>
                          <TableHead className="h-11">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayCandidates.map((candidate) => (
                          <TableRow
                            key={candidate.id}
                            className={cn(
                              "h-14 transition-colors",
                              selectedLeadIds.has(candidate.id) && "bg-muted/50"
                            )}
                          >
                            <TableCell className="w-12">
                              <Checkbox
                                checked={selectedLeadIds.has(candidate.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectLead(candidate.id, checked as boolean)
                                }
                                aria-label={`Select ${candidate.name}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                            <TableCell className="font-mono text-sm">{formatPhoneForDisplay(candidate.phone)}</TableCell>
                            <TableCell>
                              {candidate.position ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {candidate.position.split(",").map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                      {tag.trim()}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={candidate.status === "completed" ? "default" : "secondary"} className="text-xs">
                                {candidate.status}
                              </Badge>
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
        </div>
      </div>
    </div>
  );
}

