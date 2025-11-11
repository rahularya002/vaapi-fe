"use client";

import { useState, useEffect } from "react";
import { Candidate } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { DashboardSection } from "@/components/DashboardSection";
import { LeadsSection } from "@/components/LeadsSection";
import { CampaignsSection } from "@/components/CampaignsSection";
import { AssistantsSection } from "@/components/AssistantsSection";
import { CallHistorySection } from "@/components/CallHistorySection";
import { SettingsSection } from "@/components/SettingsSection";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

type SectionKey = "dashboard" | "leads" | "campaigns" | "assistants" | "history" | "settings";

const sectionNames: Record<SectionKey, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  campaigns: "Campaigns",
  assistants: "Assistants",
  history: "Call History",
  settings: "Settings",
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [callQueue, setCallQueue] = useState<Candidate[]>([]);
  const [callHistory, setCallHistory] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [currentCall, setCurrentCall] = useState<Candidate | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [showTwilioDialog, setShowTwilioDialog] = useState(false);
  const [hasCheckedTwilio, setHasCheckedTwilio] = useState(false);

  useEffect(() => {
    loadCallData();
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      checkTwilioIntegration();
    }
  }, [session]);

  const checkTwilioIntegration = async () => {
    if (!session?.user?.email || hasCheckedTwilio) return;
    
    try {
      // Check if user has dismissed the dialog before (user-specific)
      const dismissed = localStorage.getItem(`twilio-dialog-dismissed-${session.user.email}`);
      if (dismissed === "true") {
        setHasCheckedTwilio(true);
        return;
      }

      // Check if Twilio is configured
      try {
        const response = await fetch("/api/settings");
        
        // Check if response is OK and is JSON
        if (!response.ok) {
          // If settings endpoint fails, assume new user and show dialog
          setShowTwilioDialog(true);
          setHasCheckedTwilio(true);
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // If response is not JSON, assume new user and show dialog
          setShowTwilioDialog(true);
          setHasCheckedTwilio(true);
          return;
        }

        const result = await response.json();
        
        // If settings exist and Twilio is configured, don't show dialog
        if (result.success && result.settings?.twilio) {
          const twilio = result.settings.twilio;
          // Check if Twilio is properly configured
          if (twilio.accountSid && twilio.authToken && twilio.phoneNumber) {
            // Twilio is configured, don't show dialog
            setHasCheckedTwilio(true);
            return;
          }
        }
        
        // If we get here, either no settings exist or Twilio is not configured
        // Show dialog for new users (first time they see the dashboard)
        setShowTwilioDialog(true);
      } catch (fetchError) {
        // If fetch fails, assume new user and show dialog
        setShowTwilioDialog(true);
      }
      
      setHasCheckedTwilio(true);
    } catch (error) {
      console.error("Error checking Twilio integration:", error);
      setHasCheckedTwilio(true);
    }
  };

  const loadCallData = async () => {
    try {
      setIsLoading(true);
      const [queueResponse, historyResponse, candidatesResponse] = await Promise.all([
        fetch("/api/calls"),
        fetch("/api/calls?type=history"),
        fetch("/api/data?action=candidates")
      ]);
      const queueData = await queueResponse.json();
      const historyData = await historyResponse.json();
      const candidatesData = await candidatesResponse.json();
      setCallQueue(queueData.queue || []);
      setCallHistory(historyData.calls || []);
      setCandidates(candidatesData.candidates || []);
    } catch (error) {
      console.error("Error loading call data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload-excel", { method: "POST", body: formData });
      const result = await response.json();
      if (result.success) {
        await loadCallData();
        toast.success("Leads uploaded", {
          description: `Successfully parsed and saved ${result.totalCount} leads from file`,
        });
      } else {
        toast.error("Upload failed", {
          description: result.error || "Failed to upload file",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload failed", {
        description: "An error occurred while uploading the file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLead = async (lead: { name: string; email: string; phone: string; tags: string[] }) => {
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_candidate",
          candidate: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            position: lead.tags.join(", "),
            status: "pending",
          },
        }),
      });
      const result = await response.json();
      if (result.success) {
        await loadCallData();
        toast.success("Lead added", {
          description: "Lead has been added successfully",
        });
      } else {
        toast.error("Failed to add lead", {
          description: result.error || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error adding lead:", error);
      toast.error("Failed to add lead", {
        description: "An unexpected error occurred",
      });
    }
  };

  const startCall = async (candidate: Candidate) => {
    setIsCalling(true);
    setCurrentCall(candidate);
    try {
      // Consume one credit before starting the call
      try {
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
          method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      } catch (e) {
        console.error('Credit consumption failed', e);
        toast.error("Credit verification failed", {
          description: "Unable to verify credits at this time",
        });
        setIsCalling(false);
        setCurrentCall(null);
        return;
      }

      const response = await fetch("/api/calls", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_call", candidateId: candidate.id })
      });

      const callResponse = await fetch("/api/vapi-call", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: candidate.phone, 
          candidateName: candidate.name,
          candidateId: candidate.id
        })
      });

      const callResult = await callResponse.json();
      if (callResult.success) {
        toast.success("Call initiated", {
          description: `Call initiated to ${candidate.name} at ${formatPhoneForDisplay(candidate.phone)}`,
        });
        loadCallData();
      } else {
        toast.error("Call failed", {
          description: callResult.error || "Failed to initiate call",
        });
      }
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Call failed", {
        description: "An error occurred while starting the call",
      });
    } finally {
      setIsCalling(false);
      setCurrentCall(null);
    }
  };

  const syncCallsFromVapi = async () => {
    try {
      setIsLoading(true);
      
      // First try importing from /logs endpoint (more efficient)
      const importResponse = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_calls_from_vapi", limit: 100, offset: 0 })
      });
      
      const importResult = await importResponse.json();
      
      // Then sync active calls
      const syncResponse = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_calls_from_vapi" })
      });
      
      const syncResult = await syncResponse.json();
      
      // Reload data after sync
      await loadCallData();
      
      const messages = [];
      if (importResult.success) {
        messages.push(`Import: ${importResult.matched || 0} calls matched, ${importResult.updated || 0} updated`);
      } else if (importResult.error) {
        if (importResult.error.includes("not available")) {
          messages.push(`Import: /logs endpoint not available (${importResult.status || 'N/A'}), using individual sync`);
        } else {
          messages.push(`Import: ${importResult.error}`);
        }
      }
      
      if (syncResult.success) {
        messages.push(`Sync: ${syncResult.updated || 0} active calls updated`);
      } else if (syncResult.error) {
        messages.push(`Sync: ${syncResult.error}`);
      }
      
      if (messages.length > 0) {
        toast.success("Sync completed", {
          description: messages.join('\n'),
        });
      } else {
        toast.success("Sync completed", {
          description: "Calls have been synced successfully",
        });
      }
    } catch (error) {
      console.error("Error syncing calls:", error);
      toast.error("Sync failed", {
        description: "An error occurred while syncing calls from VAPI",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      // Convert call history to CSV
      const headers = ["Lead", "Number", "Outcome", "Duration", "Agent", "Time"];
      const rows = callHistory.map((call) => {
        const formatDuration = (seconds?: number) => {
          if (!seconds) return "-";
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}m ${secs}s`;
        };
        const formatTime = (dateString?: string) => {
          if (!dateString) return "-";
          return new Date(dateString).toLocaleString();
        };
        const getOutcome = (call: Candidate) => {
          if (call.success_evaluation) return call.success_evaluation.toUpperCase();
          if (call.ended_reason) {
            if (call.ended_reason.includes("completed") || call.ended_reason.includes("customer-ended")) {
              return "Completed";
            }
            if (call.ended_reason.includes("not-answer") || call.ended_reason.includes("timeout")) {
              return "Failed";
            }
          }
          return "Unknown";
        };
        return [
          call.name || "-",
          formatPhoneForDisplay(call.phone),
          getOutcome(call),
          formatDuration(call.call_duration),
          call.assistant_name || "Unknown",
          formatTime(call.call_start_time),
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported", {
        description: "Call history has been exported successfully",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Export failed", {
        description: "An error occurred while exporting CSV",
      });
    }
  };


  const handleSaveSettings = async (settings: any) => {
    try {
      // Save settings
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Settings saved", {
          description: "Your settings have been saved successfully",
        });
      } else {
        toast.error("Save failed", {
          description: result.error || "Failed to save settings",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Save failed", {
        description: "An error occurred while saving settings",
      });
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardSection
            candidates={candidates}
            callQueue={callQueue}
            callHistory={callHistory}
          />
        );
      case "leads":
        return (
          <LeadsSection
            isLoading={isLoading}
            isUploading={isUploading}
            candidates={candidates}
            onFileUpload={handleFileUpload}
            onAddLead={handleAddLead}
            onRefresh={loadCallData}
          />
        );
      case "campaigns":
        return <CampaignsSection />;
      case "assistants":
        return <AssistantsSection />;
      case "history":
        return (
          <CallHistorySection
            callHistory={callHistory}
            onExportCSV={exportCSV}
            onSyncFromVapi={syncCallsFromVapi}
          />
        );
      case "settings":
        return <SettingsSection onSaveSettings={handleSaveSettings} />;
      default:
        return null;
    }
  };

  const handleConnectTwilio = () => {
    setShowTwilioDialog(false);
    setActiveSection("settings");
    // Scroll to integrations section after a brief delay
    setTimeout(() => {
      const integrationsSection = document.querySelector('[data-section="integrations"]');
      if (integrationsSection) {
        integrationsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  };

  const handleDismissTwilio = () => {
    setShowTwilioDialog(false);
    // Store dismissal with user email to make it user-specific
    if (session?.user?.email) {
      localStorage.setItem(`twilio-dialog-dismissed-${session.user.email}`, "true");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => setActiveSection(section as SectionKey)}
      />
      <div className="flex-1 flex flex-col ml-64">
        <TopBar sectionName={sectionNames[activeSection]} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderSection()}
          </div>
        </main>
      </div>

      {/* Twilio Integration Dialog */}
      <Dialog open={showTwilioDialog} onOpenChange={setShowTwilioDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>Connect Twilio</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              To start making calls, you'll need to connect your Twilio account. This allows us to manage phone numbers and handle calling functionality.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You can connect your Twilio integration in Settings. This will enable you to make calls to your leads and manage your calling campaigns.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleConnectTwilio} className="flex-1">
                Connect Twilio
              </Button>
              <Button variant="outline" onClick={handleDismissTwilio} className="flex-1">
                Do it later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
