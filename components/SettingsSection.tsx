"use client";

import { useState } from "react";
import { Settings, Globe, Moon, Sun, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettingsSectionProps {
  onSaveSettings?: (settings: any) => Promise<void>;
}

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
];

const locales = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "hi", label: "Hindi" },
];

export function SettingsSection({ onSaveSettings }: SettingsSectionProps) {
  const [timezone, setTimezone] = useState("America/New_York");
  const [locale, setLocale] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>General</span>
          </CardTitle>
          <CardDescription>
            Configure general application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="locale">
                <SelectValue placeholder="Select locale" />
              </SelectTrigger>
              <SelectContent>
                {locales.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle dark mode theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (onSaveSettings) {
                  await onSaveSettings({
                    timezone,
                    locale,
                    darkMode,
                  });
                }
              }}
            >
              Save General Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card data-section="integrations">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Integrations</span>
          </CardTitle>
          <CardDescription>
            Connect external services for phone numbers and calling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Twilio Integration */}
          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center space-x-2 mb-2">
              <Phone className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Twilio</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure Twilio for phone number management and SMS capabilities
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="twilio-account-sid" className="text-sm font-medium">
                  Account SID
                </Label>
                <Input
                  id="twilio-account-sid"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-auth-token" className="text-sm font-medium">
                  Auth Token
                </Label>
                <Input
                  id="twilio-auth-token"
                  type="password"
                  placeholder="Enter your Twilio auth token"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-phone-number" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="twilio-phone-number"
                  placeholder="+1234567890"
                  value={twilioPhoneNumber}
                  onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Test Connection
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={async () => {
                if (onSaveSettings) {
                  await onSaveSettings({
                    twilio: {
                      accountSid: twilioAccountSid,
                      authToken: twilioAuthToken,
                      phoneNumber: twilioPhoneNumber,
                    },
                  });
                }
              }}
            >
              Save Integration Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

