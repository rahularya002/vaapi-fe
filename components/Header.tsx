import { Phone, Database, Download, Trash2, Settings } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import CreditsBadge from "@/components/CreditsBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface HeaderProps {
  callQueueLength: number;
  dataLocation: string;
  language: string;
  onExportData: () => void;
  onClearAllData: () => void;
}

export function Header({ 
  callQueueLength, 
  dataLocation, 
  language, 
  onExportData, 
  onClearAllData 
}: HeaderProps) {
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Voixly</h1>
            </div>
            <Badge variant="outline" className="text-sm">
              {callQueueLength} in queue
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>{dataLocation}</span>
            </div>
            
            <div className="flex items-center space-x-2 px-3 py-1 bg-black rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                language === "hi" ? 'bg-orange-500' : 'bg-blue-500'
              }`}></div>
              <span className="text-sm font-medium">
                {language === "hi" ? "हिंदी" : "English"}
              </span>
            </div>
            
            <Button variant="outline" size="sm" onClick={onExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            
            <Button variant="outline" size="sm" onClick={onClearAllData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Call Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your calling settings and interview script
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <h3 className="font-semibold text-green-900">VAPI Assistant Calls</h3>
                        <p className="text-sm text-green-700 mt-1">
                          All calls use your pre-configured VAPI assistant with your Twilio number imported to VAPI.
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          <strong>Normal calls</strong> - No automated scripts, uses your VAPI configuration directly.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <h3 className="font-semibold text-green-900">Using VAPI Assistant</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Your calls will use your pre-configured VAPI assistant. No local script needed.
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          Configure your assistant in the <strong>Assistant tab</strong> or use your existing VAPI configuration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <CreditsBadge />

            <AccountMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
