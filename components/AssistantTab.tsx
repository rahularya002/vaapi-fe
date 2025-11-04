import { Settings, Database, Phone, Users, FileText, Save, RefreshCw, Plus, Trash2, Copy, CheckCircle, AlertCircle, Info, Sparkles, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssistantConfig, AssistantStatus } from "@/lib/types";
import { useState, useEffect } from "react";

interface VapiAssistant {
  id: string;
  name: string;
  model: any;
  voice: any;
  transcription: any;
  instructions: string;
  firstMessage?: string;
  firstMessageMode?: string;
  messageMode?: string;
  maxDurationSeconds?: number;
  interruptionThreshold?: number;
  backgroundSound?: string;
  silenceTimeoutSeconds?: number;
  responseDelaySeconds?: number;
  voicemailDetection?: boolean;
  voicemailMessage?: string;
  endCallMessage?: string;
  endCallPhrases?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AssistantTabProps {
  assistantConfig: AssistantConfig;
  assistantStatus: AssistantStatus;
  onSetAssistantConfig: (config: AssistantConfig) => void;
  onTestAssistantConnection: () => void;
  onCreateTestAssistant: () => void;
  onLoadAssistantConfig: () => void;
  onLoadExistingHindiAssistant: () => void;
  onUseVapiAssistantDirectly: () => void;
  onSaveAssistantConfig: () => void;
}

export function AssistantTab({
  assistantConfig,
  assistantStatus,
  onSetAssistantConfig,
  onTestAssistantConnection,
  onCreateTestAssistant,
  onLoadAssistantConfig,
  onLoadExistingHindiAssistant,
  onUseVapiAssistantDirectly,
  onSaveAssistantConfig
}: AssistantTabProps) {
  const [vapiAssistants, setVapiAssistants] = useState<VapiAssistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<VapiAssistant | null>(null);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isSystemPromptFullscreen, setIsSystemPromptFullscreen] = useState(false);

  // Fetch VAPI assistants on component mount
  useEffect(() => {
    fetchVapiAssistants();
  }, []);

  const fetchVapiAssistants = async () => {
    setIsLoadingAssistants(true);
    try {
      const response = await fetch("/api/vapi-assistant");
      const result = await response.json();
      
      if (result.success && result.assistants) {
        setVapiAssistants(result.assistants);
        console.log("Fetched VAPI assistants:", result.assistants);
      } else {
        console.error("Failed to fetch assistants:", result.error);
      }
    } catch (error) {
      console.error("Error fetching VAPI assistants:", error);
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  const loadAssistantFromVapi = async (assistant: VapiAssistant) => {
    try {
      const response = await fetch(`/api/vapi-assistant?assistantId=${assistant.id}`);
      const result = await response.json();
      
      if (result.success && result.assistant) {
        const vapiAssistant = result.assistant;
        setSelectedAssistant(vapiAssistant);
        
        console.log("VAPI Assistant loaded:", vapiAssistant);
        console.log("VAPI Instructions (raw):", vapiAssistant.instructions);
        console.log("VAPI Instructions (type):", typeof vapiAssistant.instructions);
        console.log("VAPI First Message:", vapiAssistant.firstMessage);
        console.log("All VAPI assistant keys:", Object.keys(vapiAssistant));
        console.log("VAPI assistant full object:", JSON.stringify(vapiAssistant, null, 2));
        console.log("VAPI model object:", vapiAssistant.model);
        console.log("VAPI model keys:", vapiAssistant.model ? Object.keys(vapiAssistant.model) : "no model");
        
        // VAPI might return instructions in different fields - check all possibilities
        // Check explicitly for undefined/null to handle empty strings correctly
        // Also check inside model object (VAPI stores it in model.messages or model.systemMessage)
        const modelSystemMessage = vapiAssistant.model?.systemMessage;
        const modelMessages = vapiAssistant.model?.messages;
        const modelFirstMessage = Array.isArray(modelMessages) && modelMessages.length > 0 && modelMessages[0]?.role === 'system' 
          ? modelMessages[0].content 
          : null;
        
        const modelInstructions = modelSystemMessage || 
                                  modelFirstMessage ||
                                  vapiAssistant.model?.prompt || 
                                  vapiAssistant.model?.instructions ||
                                  vapiAssistant.model?.systemPrompt ||
                                  null;
        
        console.log("Model systemMessage:", modelSystemMessage);
        console.log("Model messages:", modelMessages);
        console.log("Model first message (system):", modelFirstMessage);
        
        const vapiInstructions = vapiAssistant.instructions !== undefined && vapiAssistant.instructions !== null ? vapiAssistant.instructions :
                                  vapiAssistant.systemMessage !== undefined && vapiAssistant.systemMessage !== null ? vapiAssistant.systemMessage :
                                  vapiAssistant.prompt !== undefined && vapiAssistant.prompt !== null ? vapiAssistant.prompt :
                                  vapiAssistant.systemPrompt !== undefined && vapiAssistant.systemPrompt !== null ? vapiAssistant.systemPrompt :
                                  vapiAssistant.message !== undefined && vapiAssistant.message !== null ? vapiAssistant.message :
                                  vapiAssistant.script !== undefined && vapiAssistant.script !== null ? vapiAssistant.script :
                                  modelInstructions !== null ? modelInstructions :
                                  null;
        
        console.log("Model instructions:", modelInstructions);
        
        console.log("Resolved VAPI instructions:", vapiInstructions);
        console.log("Will use VAPI instructions:", vapiInstructions !== null);
        
        // Update the assistant config with VAPI data
        // Prioritize VAPI data over existing config
        const updatedConfig: AssistantConfig = {
          name: vapiAssistant.name || assistantConfig.name,
          language: assistantConfig.language, // Keep current language setting
          model: vapiAssistant.model || assistantConfig.model,
          voice: vapiAssistant.voice || assistantConfig.voice,
          transcription: vapiAssistant.transcription || assistantConfig.transcription,
          // Use VAPI instructions if available (even if empty string)
          // If no VAPI instructions found, use empty string instead of hardcoded fallback
          instructions: vapiInstructions !== null ? vapiInstructions : "",
          // Always use VAPI firstMessage if it exists
          firstMessage: vapiAssistant.firstMessage !== undefined && vapiAssistant.firstMessage !== null
            ? vapiAssistant.firstMessage
            : assistantConfig.firstMessage,
          firstMessageMode: vapiAssistant.firstMessageMode || vapiAssistant.messageMode || assistantConfig.firstMessageMode || "assistant-speaks-first",
          maxDurationSeconds: vapiAssistant.maxDurationSeconds || assistantConfig.maxDurationSeconds,
          interruptionThreshold: vapiAssistant.interruptionThreshold || assistantConfig.interruptionThreshold,
          backgroundSound: vapiAssistant.backgroundSound || assistantConfig.backgroundSound,
          silenceTimeoutSeconds: vapiAssistant.silenceTimeoutSeconds || assistantConfig.silenceTimeoutSeconds,
          responseDelaySeconds: vapiAssistant.responseDelaySeconds || assistantConfig.responseDelaySeconds
        };
        
        console.log("Updated config instructions:", updatedConfig.instructions);
        
        onSetAssistantConfig(updatedConfig);
        alert(`Loaded assistant: ${vapiAssistant.name}`);
      } else {
        alert(`Failed to load assistant: ${result.error}`);
      }
    } catch (error) {
      console.error("Error loading assistant:", error);
      alert("Error loading assistant");
    }
  };

  const createNewVapiAssistant = async () => {
    setIsCreatingAssistant(true);
    try {
      const response = await fetch("/api/vapi-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: assistantConfig.name,
          model: assistantConfig.model,
          voice: assistantConfig.voice,
          transcription: assistantConfig.transcription,
          instructions: assistantConfig.instructions,
          firstMessage: assistantConfig.firstMessage,
          firstMessageMode: assistantConfig.firstMessageMode,
          maxDurationSeconds: assistantConfig.maxDurationSeconds,
          interruptionThreshold: assistantConfig.interruptionThreshold,
          backgroundSound: assistantConfig.backgroundSound,
          silenceTimeoutSeconds: assistantConfig.silenceTimeoutSeconds,
          responseDelaySeconds: assistantConfig.responseDelaySeconds
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Assistant created successfully! ID: ${result.assistant.id}`);
        // Refresh the assistants list
        await fetchVapiAssistants();
      } else {
        alert(`Failed to create assistant: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating assistant:", error);
      alert("Error creating assistant");
    } finally {
      setIsCreatingAssistant(false);
    }
  };
  const handleLanguageChange = (value: string) => {
    const newConfig = { ...assistantConfig, language: value };
    
    // Update voice and transcription settings based on language
    if (value === "hi") {
      newConfig.voice = {
        ...assistantConfig.voice,
        voiceId: "hindi-male-1" // Hindi voice
      };
      newConfig.transcription = {
        ...assistantConfig.transcription,
        language: "hi"
      };
      newConfig.instructions = `आप एक पेशेवर साक्षात्कार सहायक हैं जो नौकरी के उम्मीदवारों के लिए फोन साक्षात्कार आयोजित करते हैं।

आपकी भूमिका है:
1. उम्मीदवार का पेशेवर तरीके से स्वागत करना
2. प्रासंगिक साक्षात्कार प्रश्न पूछना
3. उनकी प्रतिक्रियाओं को सक्रिय रूप से सुनना
4. महत्वपूर्ण जानकारी का नोट लेना
5. मित्रवत लेकिन पेशेवर रहना
6. यदि वे मानव से बात करना चाहते हैं, तो   समझाएं कि यह एक स्वचालित स्क्रीनिंग है
7. अंत में उनके समय के लिए धन्यवाद देना

हमेशा सम्मानजनक, धैर्यवान और पेशेवर रहें।`;
    } else {
      newConfig.voice = {
        ...assistantConfig.voice,
        voiceId: "adam" // English voice
      };
      newConfig.transcription = {
        ...assistantConfig.transcription,
        language: "multi"
      };
      newConfig.instructions = `You are a professional interview assistant conducting phone interviews for job candidates. 

Your role is to:
1. Greet the candidate professionally
2. Ask relevant interview questions
3. Listen actively to their responses
4. Take notes of key information
5. Be friendly but professional
6. If they ask to speak to a human, explain this is an automated screening
7. Thank them for their time at the end

Always be respectful, patient, and professional.`;
    }
    
    onSetAssistantConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">VAPI Assistant</h2>
          <p className="text-muted-foreground">Create and manage your AI voice assistants</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchVapiAssistants}
            disabled={isLoadingAssistants}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingAssistants ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button 
            onClick={createNewVapiAssistant}
            disabled={isCreatingAssistant}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>{isCreatingAssistant ? 'Creating...' : 'Create Assistant'}</span>
          </Button>
        </div>
      </div>

      {/* Existing Assistants Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Your VAPI Assistants ({vapiAssistants.length})</span>
          </CardTitle>
          <CardDescription>
            Select an existing assistant to load its configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAssistants ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Loading assistants...</span>
              </div>
            </div>
          ) : vapiAssistants.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assistants found</h3>
              <p className="text-muted-foreground mb-4">Create your first assistant to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vapiAssistants.map((assistant) => (
                <Card key={assistant.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{assistant.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {assistant.model?.provider || 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {assistant.instructions?.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(assistant.createdAt).toLocaleDateString()}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => loadAssistantFromVapi(assistant)}
                        className="text-xs"
                      >
                        Load
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assistant Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Assistant Configuration</span>
            {assistantStatus.isConfigured && (
              <Badge variant="default" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configure your assistant's behavior, voice, and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assistant-name">Assistant Name</Label>
                <Input
                  id="assistant-name"
                  value={assistantConfig.name}
                  onChange={(e) => onSetAssistantConfig({
                    ...assistantConfig,
                    name: e.target.value
                  })}
                  placeholder="My Interview Assistant"
                />
              </div>
              <div>
                <Label htmlFor="assistant-language">Language</Label>
                <Select
                  value={assistantConfig.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🇺🇸</span>
                        <span>English</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hi">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🇮🇳</span>
                        <span>Hindi (हिंदी)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Model Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Model</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure the behavior of the assistant.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model-provider">Provider</Label>
                <Select
                  value={assistantConfig.model.provider}
                  onValueChange={(value) => onSetAssistantConfig({
                    ...assistantConfig,
                    model: { ...assistantConfig.model, provider: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="model-name">Model</Label>
                <Select
                  value={assistantConfig.model.model}
                  onValueChange={(value) => onSetAssistantConfig({
                    ...assistantConfig,
                    model: { ...assistantConfig.model, model: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-cluster">GPT 4o Cluster</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Temperature: {assistantConfig.model.temperature}</Label>
              <Slider
                value={[assistantConfig.model.temperature]}
                onValueChange={([value]) => onSetAssistantConfig({
                  ...assistantConfig,
                  model: { ...assistantConfig.model, temperature: value }
                })}
                min={0}
                max={2}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>

          <Separator />

          {/* First Message Mode */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="first-message-mode" className="text-base font-semibold">First Message Mode</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Select
              value={assistantConfig.firstMessageMode || "assistant-speaks-first"}
              onValueChange={(value) => onSetAssistantConfig({
                ...assistantConfig,
                firstMessageMode: value
              })}
            >
              <SelectTrigger id="first-message-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant-speaks-first">Assistant speaks first</SelectItem>
                <SelectItem value="wait-for-user">Wait for user</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* First Message */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="first-message" className="text-base font-semibold">First Message</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              <Input
                id="first-message"
                value={assistantConfig.firstMessage || ""}
                onChange={(e) => onSetAssistantConfig({
                  ...assistantConfig,
                  firstMessage: e.target.value
                })}
                placeholder="नमस्ते! मैं आरती बोल रही हूँ राजस्थली एम्पोरियम, जयपुर की तरफ से। क्या मैं आपका नाम जान सकती हूँ?"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Generate first message based on instructions
                  const generatedMessage = assistantConfig.language === "hi" 
                    ? "नमस्ते! मैं आरती बोल रही हूँ राजस्थली एम्पोरियम, जयपुर की तरफ से। क्या मैं आपका नाम जान सकती हूँ?"
                    : "Hello! This is an automated call. May I know your name?";
                  onSetAssistantConfig({
                    ...assistantConfig,
                    firstMessage: generatedMessage
                  });
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          <Separator />

          {/* Voice Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Voice Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voice-provider">Voice Provider</Label>
                <Select
                  value={assistantConfig.voice.provider}
                  onValueChange={(value) => onSetAssistantConfig({
                    ...assistantConfig,
                    voice: { ...assistantConfig.voice, provider: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
                    <SelectItem value="playht">PlayHT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="voice-id">Voice ID</Label>
                <Input
                  id="voice-id"
                  value={assistantConfig.voice.voiceId}
                  onChange={(e) => onSetAssistantConfig({
                    ...assistantConfig,
                    voice: { ...assistantConfig.voice, voiceId: e.target.value }
                  })}
                  placeholder={assistantConfig.language === "hi" ? "hindi-male-1" : "adam"}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Speed: {assistantConfig.voice.speed}</Label>
                <Slider
                  value={[assistantConfig.voice.speed]}
                  onValueChange={([value]) => onSetAssistantConfig({
                    ...assistantConfig,
                    voice: { ...assistantConfig.voice, speed: value }
                  })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Pitch: {assistantConfig.voice.pitch}</Label>
                <Slider
                  value={[assistantConfig.voice.pitch]}
                  onValueChange={([value]) => onSetAssistantConfig({
                    ...assistantConfig,
                    voice: { ...assistantConfig.voice, pitch: value }
                  })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* System Prompt */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="system-prompt" className="text-base font-semibold">System Prompt</Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSystemPromptFullscreen(!isSystemPromptFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="system-prompt"
              value={assistantConfig.instructions}
              onChange={(e) => onSetAssistantConfig({
                ...assistantConfig,
                instructions: e.target.value
              })}
              placeholder={assistantConfig.language === "hi" 
                ? "Enter system prompt for your assistant..."
                : "Enter system prompt for your assistant..."
              }
              className={`min-h-[200px] ${isSystemPromptFullscreen ? 'h-[600px]' : ''}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {assistantConfig.language === "hi" 
                  ? "System prompt defines the assistant's behavior and guidelines"
                  : "System prompt defines the assistant's behavior and guidelines"
                }
              </span>
              <span>{assistantConfig.instructions.length} characters</span>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="advanced-settings"
              checked={showAdvancedSettings}
              onCheckedChange={setShowAdvancedSettings}
            />
            <Label htmlFor="advanced-settings">Show Advanced Settings</Label>
          </div>

          {/* Advanced Settings */}
          {showAdvancedSettings && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-duration">Max Duration (seconds)</Label>
                  <Input
                    id="max-duration"
                    type="number"
                    value={assistantConfig.maxDurationSeconds}
                    onChange={(e) => onSetAssistantConfig({
                      ...assistantConfig,
                      maxDurationSeconds: parseInt(e.target.value) || 600
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="silence-timeout">Silence Timeout (seconds)</Label>
                  <Input
                    id="silence-timeout"
                    type="number"
                    value={assistantConfig.silenceTimeoutSeconds}
                    onChange={(e) => onSetAssistantConfig({
                      ...assistantConfig,
                      silenceTimeoutSeconds: parseInt(e.target.value) || 5
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="interruption-threshold">Interruption Threshold (ms)</Label>
                  <Input
                    id="interruption-threshold"
                    type="number"
                    value={assistantConfig.interruptionThreshold}
                    onChange={(e) => onSetAssistantConfig({
                      ...assistantConfig,
                      interruptionThreshold: parseInt(e.target.value) || 1000
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="response-delay">Response Delay (seconds)</Label>
                  <Input
                    id="response-delay"
                    type="number"
                    value={assistantConfig.responseDelaySeconds}
                    onChange={(e) => onSetAssistantConfig({
                      ...assistantConfig,
                      responseDelaySeconds: parseFloat(e.target.value) || 0.5
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                assistantStatus.isConfigured ? 'bg-green-500' : 'bg-orange-500'
              }`}></div>
              <span className="text-sm text-muted-foreground">
                {assistantStatus.isConfigured 
                  ? "Assistant is ready for calls"
                  : "Configure assistant to enable calling"
                }
              </span>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={onLoadAssistantConfig}
                className="flex items-center space-x-1"
              >
                <FileText className="h-3 w-3" />
                <span>Load Config</span>
              </Button>
              <Button 
                onClick={onSaveAssistantConfig}
                className="flex items-center space-x-1"
              >
                <Save className="h-3 w-3" />
                <span>Save Config</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
