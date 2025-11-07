"use client";

import { useState, useEffect, useRef } from "react";
import { Megaphone, Sparkles, Loader2, Plus, Phone, Play, Pause, SkipForward, Square, Users, Trash2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { useSession } from "next-auth/react";

interface Campaign {
  id?: number;
  name: string;
  industry: string;
  goal: string;
  openingScript: string;
  localizeTone: boolean;
  complianceCheck: boolean;
  cadence: boolean;
  quality: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CampaignsSectionProps {
  onSaveCampaign?: (campaign: any) => Promise<void>;
}

const industries = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "real-estate", label: "Real Estate" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
];

const goals = [
  { value: "book-meetings", label: "Book meetings" },
  { value: "qualify-leads", label: "Qualify leads" },
  { value: "winback", label: "Winback" },
];

const industryTemplates: Record<string, { description: string; script: string }> = {
  saas: {
    description: "Software as a Service outreach and demos",
    script: "Hi {{name}}, I'm reaching out from {{company}}. We noticed you might be interested in our SaaS solution. Would you be open to a quick 15-minute demo to see how it could help your business?",
  },
  ecommerce: {
    description: "E-commerce customer engagement and support",
    script: "Hello {{name}}, this is {{company}}. We wanted to check in about your recent order and see if you need any assistance. Also, we have some exclusive offers that might interest you!",
  },
  manufacturing: {
    description: "Manufacturing supply chain and B2B outreach",
    script: "Hi {{name}}, I'm calling from {{company}}. We specialize in manufacturing solutions and thought our services might align with your operations. Could we schedule a brief call to discuss?",
  },
  "real-estate": {
    description: "Real estate property follow-ups and inquiries",
    script: "Hi {{name}}, this is {{company}}. I'm following up on your interest in our property listings. Would you like to schedule a viewing or have any questions about the properties?",
  },
  healthcare: {
    description: "Appointment reminders and follow-up care",
    script: "Hi {{name}}, this is a reminder for your appointment with Dr. {{doctor_name}} on {{date}} at {{time}}. Reply YES to confirm or call us to reschedule.",
  },
  education: {
    description: "Educational program enrollment and information",
    script: "Hello {{name}}, this is {{company}}. We're reaching out about our educational programs that might be a great fit for you. Would you like to learn more about our courses and enrollment options?",
  },
};

export function CampaignsSection({ onSaveCampaign }: CampaignsSectionProps) {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [openingScript, setOpeningScript] = useState("");
  const [localizeTone, setLocalizeTone] = useState(false);
  const [complianceCheck, setComplianceCheck] = useState(true);
  const [cadence, setCadence] = useState(false);
  const [quality, setQuality] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCampaignId, setNewCampaignId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Calling dialog state
  const [isCallingDialogOpen, setIsCallingDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCall, setCurrentCall] = useState<Candidate | null>(null);

  // Multi-select delete state
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assistant selection state
  const [assistants, setAssistants] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Scroll to top and highlight new campaign
  useEffect(() => {
    if (newCampaignId && listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Remove highlight after animation
      setTimeout(() => setNewCampaignId(null), 2000);
    }
  }, [newCampaignId]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/campaigns");
      const result = await response.json();
      if (result.success) {
        setCampaigns(result.campaigns || []);
      }
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaignIds(new Set(campaigns.filter(c => c.id).map(c => c.id!)));
    } else {
      setSelectedCampaignIds(new Set());
    }
  };

  const handleSelectCampaign = (campaignId: number, checked: boolean) => {
    setSelectedCampaignIds((prev) => {
      const updated = new Set(prev);
      if (checked) {
        updated.add(campaignId);
      } else {
        updated.delete(campaignId);
      }
      return updated;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedCampaignIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignIds: Array.from(selectedCampaignIds),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Campaigns deleted", {
          description: `${selectedCampaignIds.size} campaign(s) deleted successfully`,
        });
        setSelectedCampaignIds(new Set());
        setIsDeleteDialogOpen(false);
        await loadCampaigns();
      } else {
        toast.error("Delete failed", {
          description: result.error || "Failed to delete campaigns",
        });
      }
    } catch (error) {
      console.error("Error deleting campaigns:", error);
      toast.error("Delete failed", {
        description: "An error occurred while deleting campaigns",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!campaignName.trim()) {
      newErrors.campaignName = "Campaign name is required";
    }
    if (!industry) {
      newErrors.industry = "Industry is required";
    }
    if (!goal) {
      newErrors.goal = "Goal is required";
    }
    if (!openingScript.trim()) {
      newErrors.openingScript = "Opening script is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIndustryChange = (value: string) => {
    setIndustry(value);
    setErrors((prev) => ({ ...prev, industry: "" }));
    if (value && industryTemplates[value]) {
      setOpeningScript(industryTemplates[value].script);
    }
  };

  const resetForm = () => {
    setCampaignName("");
    setIndustry("");
    setGoal("");
    setOpeningScript("");
    setLocalizeTone(false);
    setComplianceCheck(true);
    setCadence(false);
    setQuality(true);
    setErrors({});
  };

  const handleCreateCampaign = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    const tempId = Date.now(); // Temporary ID for optimistic update
    
    const campaignData: Omit<Campaign, "id" | "created_at" | "updated_at"> = {
      name: campaignName.trim(),
      industry,
      goal,
      openingScript: openingScript.trim(),
      localizeTone,
      complianceCheck,
      cadence,
      quality,
    };

    // Optimistic update - add temporary campaign to the top of the list
    const optimisticCampaign: Campaign = {
      ...campaignData,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCampaigns((prev) => [optimisticCampaign, ...prev]);
    setNewCampaignId(tempId);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Rollback optimistic update
        setCampaigns((prev) => prev.filter((c) => c.id !== tempId));
        setNewCampaignId(null);

        if (response.status === 422) {
          // Validation error
          if (result.errors) {
            setErrors(result.errors);
          }
          toast.error("Validation failed", {
            description: result.error || "Please check the form fields",
          });
          return;
        }

        if (response.status === 409) {
          // Duplicate name
          toast.error("Campaign name already exists", {
            description: `A campaign named "${campaignName}" already exists. Please choose a different name.`,
          });
          setErrors({ campaignName: "This campaign name already exists" });
          return;
        }

        // Generic error
        toast.error("Create failed", {
          description: result.error || "Failed to create campaign. Please try again.",
        });
        return;
      }

      if (result.success && result.campaign) {
        // Replace optimistic update with real campaign
        setCampaigns((prev) => {
          const filtered = prev.filter((c) => c.id !== tempId);
          return [result.campaign, ...filtered];
        });
        setNewCampaignId(result.campaign.id || null);

        // Reset form and close dialog
        resetForm();
        setIsDialogOpen(false);

        // Scroll to top
        if (listRef.current) {
          listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        toast.success("Campaign created", {
          description: `"${result.campaign.name}" is now available.`,
        });
      }
    } catch (error) {
      // Rollback optimistic update
      setCampaigns((prev) => prev.filter((c) => c.id !== tempId));
      setNewCampaignId(null);

      console.error("Error creating campaign:", error);
      toast.error("Create failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const previewScript = openingScript || "Enter your opening script to see a preview...";

  const getIndustryLabel = (value: string) => {
    return industries.find((ind) => ind.value === value)?.label || value;
  };

  const getGoalLabel = (value: string) => {
    return goals.find((g) => g.value === value)?.label || value;
  };

  const handleStartCalling = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsCallingDialogOpen(true);
    setIsLoadingCandidates(true);
    setIsLoadingAssistants(true);
    
    try {
      // Fetch candidates (leads) and assistants in parallel
      const [candidatesResponse, assistantsResponse] = await Promise.all([
        fetch("/api/data?action=candidates"),
        fetch("/api/assistants"),
      ]);

      const candidatesResult = await candidatesResponse.json();
      const assistantsResult = await assistantsResponse.json();

      // Handle candidates
      if (candidatesResult.success && candidatesResult.candidates) {
        setCandidates(candidatesResult.candidates || []);
        setCurrentCallIndex(0);
        if (candidatesResult.candidates.length === 0) {
          toast.info("No leads available", {
            description: "There are no leads to call for this campaign. Please upload leads first.",
          });
        }
      } else {
        setCandidates([]);
        toast.info("No leads available", {
          description: "There are no leads to call for this campaign. Please upload leads first.",
        });
      }

      // Handle assistants
      if (assistantsResult.success && assistantsResult.assistants) {
        const assistantsList = assistantsResult.assistants.map((a: any) => ({
          id: a.id,
          name: a.name,
        }));
        setAssistants(assistantsList);
        // Auto-select first assistant if available
        if (assistantsList.length > 0 && !selectedAssistantId) {
          setSelectedAssistantId(assistantsList[0].id);
        }
      } else {
        setAssistants([]);
        toast.error("Failed to load assistants", {
          description: "Unable to load assistants. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data", {
        description: "An error occurred while loading leads and assistants.",
      });
      setCandidates([]);
      setAssistants([]);
    } finally {
      setIsLoadingCandidates(false);
      setIsLoadingAssistants(false);
    }
  };

  const handleStartCall = async () => {
    if (candidates.length === 0) {
      toast.error("No leads available", {
        description: "There are no leads to call.",
      });
      return;
    }

    if (!selectedAssistantId) {
      toast.error("No assistant selected", {
        description: "Please select an assistant before starting a call.",
      });
      return;
    }

    if (currentCallIndex >= candidates.length) {
      toast.info("All leads called", {
        description: "You have called all available leads for this campaign.",
      });
      return;
    }

    const candidate = candidates[currentCallIndex];
    setIsCalling(true);
    setCurrentCall(candidate);
    setIsPaused(false);

    try {
      // Consume credit
      const email = session?.user?.email as string | undefined;
      if (!email) {
        toast.error("Sign in required", {
          description: "Please sign in to place a call",
        });
        setIsCalling(false);
        setCurrentCall(null);
        return;
      }

      const consumeRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'consume', email })
      });

      if (!consumeRes.ok) {
        const data = await consumeRes.json();
        if (data?.error === 'INSUFFICIENT_CREDITS') {
          toast.error("Insufficient credits", {
            description: "You have no credits left. Please top up to place calls.",
          });
          setIsCalling(false);
          setCurrentCall(null);
          return;
        }
        throw new Error(data?.error || 'Failed to consume credit');
      }

      // Start call
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_call", candidateId: candidate.id })
      });

      const callResponse = await fetch("/api/vapi-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: candidate.phone,
          candidateName: candidate.name,
          candidateId: candidate.id,
          assistantId: selectedAssistantId || undefined
        })
      });

      const callResult = await callResponse.json();
      if (callResult.success) {
        toast.success("Call initiated", {
          description: `Calling ${candidate.name} at ${formatPhoneForDisplay(candidate.phone)}`,
        });
      } else {
        toast.error("Call failed", {
          description: callResult.error || "Failed to initiate call",
        });
        setIsCalling(false);
        setCurrentCall(null);
      }
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Call failed", {
        description: "An error occurred while starting the call",
      });
      setIsCalling(false);
      setCurrentCall(null);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? "Calling resumed" : "Calling paused", {
      description: isPaused ? "You can continue calling leads." : "Calling has been paused.",
    });
  };

  const handleNextLead = () => {
    if (currentCallIndex < candidates.length - 1) {
      setCurrentCallIndex(currentCallIndex + 1);
      setCurrentCall(null);
      setIsCalling(false);
      setIsPaused(false);
      toast.info("Next lead", {
        description: `Moving to lead ${currentCallIndex + 2} of ${candidates.length}`,
      });
    } else {
      toast.info("All leads called", {
        description: "You have called all available leads for this campaign.",
      });
    }
  };

  const handleEndSession = () => {
    setIsCallingDialogOpen(false);
    setSelectedCampaign(null);
    setCurrentCallIndex(0);
    setIsCalling(false);
    setIsPaused(false);
    setCurrentCall(null);
    toast.success("Session ended", {
      description: "Calling session has been ended.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5" />
                <span>Campaigns ({campaigns.length})</span>
              </CardTitle>
              <CardDescription>
                Manage your campaigns and their configurations
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading campaigns...</span>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-1">No campaigns yet</p>
              <p className="text-sm">Create your first campaign to get started</p>
            </div>
          ) : (
            <div ref={listRef} className="space-y-4">
              {selectedCampaignIds.size > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <span className="text-sm font-medium">
                    {selectedCampaignIds.size} campaign{selectedCampaignIds.size !== 1 ? "s" : ""} selected
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
                        <AlertDialogTitle>Delete Selected Campaigns?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedCampaignIds.size} campaign{selectedCampaignIds.size !== 1 ? "s" : ""}? This action cannot be undone.
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
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-11 w-12">
                        <Checkbox
                          checked={campaigns.length > 0 && selectedCampaignIds.size === campaigns.filter(c => c.id).length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all campaigns"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow
                        key={campaign.id}
                        className={cn(
                          "transition-colors",
                          newCampaignId === campaign.id && "bg-primary/5 animate-pulse",
                          campaign.id && selectedCampaignIds.has(campaign.id) && "bg-muted/50"
                        )}
                      >
                        <TableCell className="w-12">
                          {campaign.id && (
                            <Checkbox
                              checked={selectedCampaignIds.has(campaign.id)}
                              onCheckedChange={(checked) =>
                                handleSelectCampaign(campaign.id!, checked as boolean)
                              }
                              aria-label={`Select ${campaign.name}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getIndustryLabel(campaign.industry)}</Badge>
                      </TableCell>
                      <TableCell>{getGoalLabel(campaign.goal)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {campaign.localizeTone && (
                            <Badge variant="outline" className="text-xs">Localize</Badge>
                          )}
                          {campaign.complianceCheck && (
                            <Badge variant="outline" className="text-xs">Compliance</Badge>
                          )}
                          {campaign.cadence && (
                            <Badge variant="outline" className="text-xs">Cadence</Badge>
                          )}
                          {campaign.quality && (
                            <Badge variant="outline" className="text-xs">Quality</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.created_at
                          ? new Date(campaign.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartCalling(campaign)}
                          className="gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Start Calling
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

      {/* Create Campaign Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Campaign</span>
            </DialogTitle>
            <DialogDescription>
              Set up a new campaign with industry-specific templates and AI-powered scripts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaign-name"
                placeholder="Q4 Property Follow-ups"
                value={campaignName}
                onChange={(e) => {
                  setCampaignName(e.target.value);
                  setErrors((prev) => ({ ...prev, campaignName: "" }));
                }}
                className={errors.campaignName ? "border-destructive" : ""}
                disabled={isCreating}
              />
              {errors.campaignName && (
                <p className="text-sm text-destructive">{errors.campaignName}</p>
              )}
            </div>

            {/* Industry and Goal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Select value={industry} onValueChange={handleIndustryChange} disabled={isCreating}>
                  <SelectTrigger id="industry" className={errors.industry ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-destructive">{errors.industry}</p>
                )}
                {industry && industryTemplates[industry] && (
                  <p className="text-sm text-muted-foreground">
                    {industryTemplates[industry].description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">
                  Goal <span className="text-destructive">*</span>
                </Label>
                <Select value={goal} onValueChange={(value) => {
                  setGoal(value);
                  setErrors((prev) => ({ ...prev, goal: "" }));
                }} disabled={isCreating}>
                  <SelectTrigger id="goal" className={errors.goal ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.goal && (
                  <p className="text-sm text-destructive">{errors.goal}</p>
                )}
              </div>
            </div>

            {/* Assistant Panel - Only show when industry is selected */}
            {industry && (
              <div className="space-y-6 pt-6 border-t transition-all duration-300 ease-in-out">
                <div>
                  <h3 className="text-lg font-semibold mb-1">AI Assistant Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your AI assistant for this campaign
                  </p>
                </div>

                {/* Opening Script & Objection Handling */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Opening Script & Objection Handling</CardTitle>
                    <CardDescription>
                      Define how your AI assistant will start conversations and handle objections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="opening-script" className="text-sm font-medium">
                        Script <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="opening-script"
                        placeholder="Enter your opening script with variables like {{name}}, {{company}}, {{date}}..."
                        value={openingScript}
                        onChange={(e) => {
                          setOpeningScript(e.target.value);
                          setErrors((prev) => ({ ...prev, openingScript: "" }));
                        }}
                        className={cn("min-h-[140px] resize-none", errors.openingScript && "border-destructive")}
                        disabled={isCreating}
                      />
                      {errors.openingScript && (
                        <p className="text-sm text-destructive">{errors.openingScript}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use variables like {"{{name}}"}, {"{{date}}"}, {"{{company}}"} for personalization
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Features */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">AI Features</CardTitle>
                    <CardDescription>
                      Enable advanced AI capabilities for your campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="localize-tone" className="text-sm font-medium cursor-pointer">
                          Localize Tone
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Adapt tone and language to regional preferences
                        </p>
                      </div>
                      <Switch
                        id="localize-tone"
                        checked={localizeTone}
                        onCheckedChange={setLocalizeTone}
                        disabled={isCreating}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="compliance-check" className="text-sm font-medium cursor-pointer">
                          Compliance Check
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically check for compliance issues
                        </p>
                      </div>
                      <Switch
                        id="compliance-check"
                        checked={complianceCheck}
                        onCheckedChange={setComplianceCheck}
                        disabled={isCreating}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="cadence" className="text-sm font-medium cursor-pointer">
                          Cadence
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Enable automated follow-up cadence
                        </p>
                      </div>
                      <Switch
                        id="cadence"
                        checked={cadence}
                        onCheckedChange={setCadence}
                        disabled={isCreating}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="quality" className="text-sm font-medium cursor-pointer">
                          Quality
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Enable quality scoring and monitoring
                        </p>
                      </div>
                      <Switch
                        id="quality"
                        checked={quality}
                        onCheckedChange={setQuality}
                        disabled={isCreating}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Live Preview */}
                <Card className="bg-muted/30 border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Live Preview</span>
                    </CardTitle>
                    <CardDescription>
                      Preview of how your AI script will appear in calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background border rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium">Sample Call</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {previewScript.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                          const samples: Record<string, string> = {
                            name: "John Doe",
                            company: "Acme Corp",
                            date: "December 15, 2024",
                            time: "2:00 PM",
                            doctor_name: "Dr. Smith",
                          };
                          return samples[varName] || `[${varName}]`;
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={isCreating || !campaignName || !industry || !goal || !openingScript}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Campaign"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Calling Dialog */}
      <Dialog open={isCallingDialogOpen} onOpenChange={setIsCallingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Start Calling - {selectedCampaign?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Call leads for this campaign. Use the controls below to manage your calling session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Assistant Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>Select Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAssistants ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading assistants...</span>
                  </div>
                ) : assistants.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No assistants available. Please create an assistant first.</p>
                  </div>
                ) : (
                  <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an assistant">
                        {assistants.find((a) => a.id === selectedAssistantId)?.name || "Select an assistant"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {assistants.map((assistant) => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          {assistant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Leads List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Available Leads ({candidates.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCandidates ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading leads...</span>
                    </div>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No leads available</p>
                    <p className="text-sm">Add leads to start calling for this campaign.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {candidates.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          index === currentCallIndex && "bg-primary/10 border-primary",
                          currentCall?.id === candidate.id && "bg-primary/20 border-primary"
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPhoneForDisplay(candidate.phone)}
                          </div>
                          {candidate.email && (
                            <div className="text-xs text-muted-foreground">{candidate.email}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {index === currentCallIndex && (
                            <Badge variant="default">Current</Badge>
                          )}
                          {currentCall?.id === candidate.id && (
                            <Badge variant="secondary">Calling...</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Call Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleStartCall}
                    disabled={isCalling || candidates.length === 0 || currentCallIndex >= candidates.length || !selectedAssistantId}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Call
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePause}
                    disabled={!isCalling}
                    className="gap-2"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextLead}
                    disabled={isCalling || currentCallIndex >= candidates.length - 1}
                    className="gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    Next Lead
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleEndSession}
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    End Session
                  </Button>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Progress: {currentCallIndex + 1} of {candidates.length} leads</p>
                  {currentCall && (
                    <p className="mt-1">
                      Currently calling: <span className="font-medium">{currentCall.name}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
