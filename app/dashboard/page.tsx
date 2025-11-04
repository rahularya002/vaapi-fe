"use client";

import { useState, useEffect } from "react";
import { Upload, Phone, Users, History, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Candidate, CallConfiguration, AssistantConfig, AssistantStatus } from "@/lib/types";
import { formatPhoneForDisplay } from "@/lib/phone-utils";
import { Header } from "@/components/Header";
import { UploadTab } from "@/components/UploadTab";
import { CandidatesTab } from "@/components/CandidatesTab";
import { QueueTab } from "@/components/QueueTab";
import { HistoryTab } from "@/components/HistoryTab";
import { AssistantTab } from "@/components/AssistantTab";
import { useSession } from "next-auth/react";

type TabKey = "upload" | "assistant" | "candidates" | "queue" | "history";

export default function Dashboard() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [callQueue, setCallQueue] = useState<Candidate[]>([]);
  const [callHistory, setCallHistory] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [currentCall, setCurrentCall] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("upload");
  const [dataLocation, setDataLocation] = useState("Loading...");
  const [callConfig, setCallConfig] = useState<CallConfiguration>({
    method: "vapi",
    script: `Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

            1. Can you tell me about yourself and your background?
            2. What interests you about this position?
            3. What are your key strengths and skills?
            4. Do you have any questions about the role or company?
            5. What is your availability for the next steps?

            Thank you for your time!`,
    voiceSettings: {
      provider: "elevenlabs",
      voiceId: "adam",
      speed: 1.0,
      pitch: 1.0
    },
    callSettings: {
      maxDuration: 15,
      retryAttempts: 2,
      delayBetweenCalls: 30
    }
  });

  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig>({
    name: "Interview Assistant",
    language: "en",
    model: { provider: "openai", model: "gpt-4o-mini", temperature: 0.7, maxTokens: 1000 },
    voice: { provider: "elevenlabs", voiceId: "adam", speed: 1.0, pitch: 1.0 },
    transcription: { provider: "deepgram", model: "nova-2", language: "multi" },
    instructions: `You are a professional interview assistant conducting phone interviews for job candidates. 

Your role is to:
1. Greet the candidate professionally
2. Ask relevant interview questions
3. Listen actively to their responses
4. Take notes of key information
5. Be friendly but professional
6. If they ask to speak to a human, explain this is an automated screening
7. Thank them for their time at the end

Always be respectful, patient, and professional.`,
    maxDurationSeconds: 600,
    interruptionThreshold: 1000,
    backgroundSound: "office",
    silenceTimeoutSeconds: 5,
    responseDelaySeconds: 0.5
  });

  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>({
    isConfigured: false,
    assistantId: null,
    lastTested: null
  });

  useEffect(() => {
    loadCallData();
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setDataLocation(hasSupabase ? "Supabase Database (Cloud)" : "Local Memory (Fallback)");
  }, []);

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
        alert(`Successfully parsed and saved ${result.totalCount} candidates from Excel file`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
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
          alert('Please sign in to place a call.');
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
            alert('You have no credits left. Please top up to place calls.');
            setIsCalling(false);
            setCurrentCall(null);
            return;
          }
          throw new Error(data?.error || 'Failed to consume credit');
        }
      } catch (e) {
        console.error('Credit consumption failed', e);
        alert('Unable to verify credits at this time.');
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
        alert(`Call initiated to ${candidate.name} at ${formatPhoneForDisplay(candidate.phone)}`);
        loadCallData();
      } else {
        alert(`Error initiating call: ${callResult.error}`);
      }
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Error starting call");
    } finally {
      setIsCalling(false);
      setCurrentCall(null);
    }
  };

  const clearQueue = async () => {
    if (confirm("Are you sure you want to clear the call queue?")) {
      try {
        const response = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear_queue" }) });
        if (response.ok) {
          setCallQueue([]);
          alert("Call queue cleared");
        }
      } catch (error) {
        console.error("Error clearing queue:", error);
        alert("Error clearing queue");
      }
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch("/api/data?action=export");
      const result = await response.json();
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `auto-caller-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        alert("Data exported successfully!");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header callQueueLength={callQueue.length} dataLocation={dataLocation} language={assistantConfig.language} onExportData={exportData} onClearAllData={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabKey)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" className="flex items-center space-x-2"><Upload className="h-4 w-4" /><span>Upload</span></TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center space-x-2"><Settings className="h-4 w-4" /><span>Assistant</span></TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Candidates ({candidates.length})</span></TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>Call Queue ({callQueue.length})</span></TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2"><History className="h-4 w-4" /><span>History ({callHistory.length})</span></TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <UploadTab isLoading={isLoading} isUploading={isUploading} candidates={candidates} onFileUpload={handleFileUpload} onAddToCallQueue={async () => {
              if (candidates.length === 0) { alert("Please upload an Excel file first"); return; }
              try {
                const response = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_to_queue", candidates }) });
                const result = await response.json();
                if (result.success) { setCallQueue(prev => [...prev, ...candidates]); alert(`Added ${candidates.length} candidates to call queue`); setActiveTab("queue"); }
                else { alert(`Error: ${result.error}`); }
              } catch (error) { console.error("Error adding to queue:", error); alert("Error adding candidates to queue"); }
            }} />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <CandidatesTab candidates={candidates} isCalling={isCalling} currentCall={currentCall} onSetActiveTab={(tab) => setActiveTab(tab as TabKey)} onStartCall={startCall} />
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <QueueTab callQueue={callQueue} isCalling={isCalling} currentCall={currentCall} onSetActiveTab={(tab) => setActiveTab(tab as TabKey)} onStartCall={startCall} onClearQueue={clearQueue} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab callHistory={callHistory} />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <AssistantTab assistantConfig={assistantConfig} assistantStatus={assistantStatus} onSetAssistantConfig={setAssistantConfig} onTestAssistantConnection={async () => {}} onCreateTestAssistant={async () => {}} onLoadAssistantConfig={async () => {
              try {
                const response = await fetch("/api/assistant");
                const result = await response.json();
                if (response.ok) {
                  setAssistantConfig(prev => ({ ...prev, name: result.name || prev.name, language: result.language || prev.language, model: result.model || prev.model, voice: result.voice || prev.voice, transcription: result.transcription || prev.transcription, instructions: result.instructions || prev.instructions, firstMessage: result.firstMessage || prev.firstMessage, firstMessageMode: result.firstMessageMode || prev.firstMessageMode }));
                  alert("Assistant configuration loaded successfully!");
                } else { alert("Failed to load assistant configuration"); }
              } catch (e) { console.error(e); alert("Error loading assistant configuration"); }
            }} onLoadExistingHindiAssistant={async () => {}} onUseVapiAssistantDirectly={async () => {}} onSaveAssistantConfig={async () => {
              try {
                const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assistantConfig) });
                const result = await response.json();
                if (result.success) alert("Assistant configuration saved successfully!"); else alert(`Failed to save configuration: ${result.error}`);
              } catch (e) { console.error(e); alert("Error saving assistant configuration"); }
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


