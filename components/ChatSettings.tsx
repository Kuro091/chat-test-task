"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  Bell,
  Shield,
  Palette,
  Database,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChatSettingsProps {
  onSettingsChange?: (settings: ChatSettingsData) => void;
}

interface ChatSettingsData {
  // General Settings
  maxMessageLength: number;
  autoSaveEnabled: boolean;
  saveInterval: number;
  maxSessions: number;

  // UI/UX Settings
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  animationsEnabled: boolean;
  compactMode: boolean;
  showTimestamps: boolean;

  // Notification Settings
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  notificationFrequency: "immediate" | "hourly" | "daily" | "never";

  // Privacy & Security
  dataRetention: number; // days
  encryptMessages: boolean;
  shareAnalytics: boolean;
  allowThirdPartyIntegrations: boolean;

  // Export Settings
  defaultExportFormat: "json" | "csv" | "txt";
  includeSystemMessages: boolean;
  compressExports: boolean;

  // Advanced Settings
  debugMode: boolean;
  experimentalFeatures: boolean;
  apiTimeout: number;
  rateLimitEnabled: boolean;
  customPrompts: string[];
}

const DEFAULT_SETTINGS: ChatSettingsData = {
  maxMessageLength: 1000,
  autoSaveEnabled: true,
  saveInterval: 30,
  maxSessions: 50,
  theme: "system",
  fontSize: "medium",
  animationsEnabled: true,
  compactMode: false,
  showTimestamps: true,
  soundEnabled: true,
  desktopNotifications: false,
  emailNotifications: false,
  notificationFrequency: "immediate",
  dataRetention: 90,
  encryptMessages: false,
  shareAnalytics: false,
  allowThirdPartyIntegrations: false,
  defaultExportFormat: "json",
  includeSystemMessages: true,
  compressExports: false,
  debugMode: false,
  experimentalFeatures: false,
  apiTimeout: 30000,
  rateLimitEnabled: true,
  customPrompts: [],
};

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<ChatSettingsData>(DEFAULT_SETTINGS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5242880 }); // 5MB default

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem("chat-settings");
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        }

        // Calculate storage usage
        let used = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length + key.length;
          }
        }
        setStorageUsage((prev) => ({ ...prev, used }));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = <K extends keyof ChatSettingsData>(
    key: K,
    value: ChatSettingsData[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem("chat-settings", JSON.stringify(settings));
      setHasUnsavedChanges(false);
      onSettingsChange?.(settings);

      // Show success message (you might want to use a toast library)
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const resetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      setHasUnsavedChanges(true);
    }
  };

  const exportSettings = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        settings: settings,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (importData.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...importData.settings });
        setHasUnsavedChanges(true);
        console.log("Settings imported successfully");
      } else {
        throw new Error("Invalid settings file format");
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import settings. Please check the file format.");
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const addCustomPrompt = () => {
    if (
      customPrompt.trim() &&
      !settings.customPrompts.includes(customPrompt.trim())
    ) {
      handleSettingChange("customPrompts", [
        ...settings.customPrompts,
        customPrompt.trim(),
      ]);
      setCustomPrompt("");
    }
  };

  const removeCustomPrompt = (index: number) => {
    const newPrompts = settings.customPrompts.filter((_, i) => i !== index);
    handleSettingChange("customPrompts", newPrompts);
  };

  const clearAllData = async () => {
    if (
      confirm(
        "This will delete ALL chat data and settings. This action cannot be undone. Are you sure?",
      )
    ) {
      if (
        confirm(
          "Last chance - this will permanently delete everything. Continue?",
        )
      ) {
        try {
          // Clear all chat-related localStorage data
          const keysToRemove = Object.keys(localStorage).filter(
            (key) => key.startsWith("chat-") || key === "chat-settings",
          );
          keysToRemove.forEach((key) => localStorage.removeItem(key));

          // Reset settings
          setSettings(DEFAULT_SETTINGS);
          setHasUnsavedChanges(false);

          alert("All data has been cleared successfully.");
        } catch (error) {
          console.error("Failed to clear data:", error);
          alert("Failed to clear data. Please try again.");
        }
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const storagePercentage = (storageUsage.used / storageUsage.total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Customize your chat experience and preferences
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes. Don't forget to save before leaving this
            page.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic configuration options for your chat interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="gap-4 grid md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxMessageLength">Max Message Length</Label>
                  <div className="space-y-2">
                    <Slider
                      id="maxMessageLength"
                      min={100}
                      max={5000}
                      step={100}
                      value={[settings.maxMessageLength]}
                      onValueChange={([value]) =>
                        handleSettingChange("maxMessageLength", value)
                      }
                    />
                    <p className="text-muted-foreground text-sm">
                      {settings.maxMessageLength} characters
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSessions">Max Stored Sessions</Label>
                  <Select
                    value={settings.maxSessions.toString()}
                    onValueChange={(value) =>
                      handleSettingChange("maxSessions", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 sessions</SelectItem>
                      <SelectItem value="50">50 sessions</SelectItem>
                      <SelectItem value="100">100 sessions</SelectItem>
                      <SelectItem value="200">200 sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label>Auto-save Messages</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically save messages as you type
                  </p>
                </div>
                <Switch
                  checked={settings.autoSaveEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange("autoSaveEnabled", checked)
                  }
                />
              </div>

              {settings.autoSaveEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="saveInterval">
                    Auto-save Interval (seconds)
                  </Label>
                  <Select
                    value={settings.saveInterval.toString()}
                    onValueChange={(value) =>
                      handleSettingChange("saveInterval", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Storage Usage
              </CardTitle>
              <CardDescription>
                Monitor your local storage usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used: {formatBytes(storageUsage.used)}</span>
                  <span>Total: {formatBytes(storageUsage.total)}</span>
                </div>
                <div className="bg-secondary rounded-full w-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      storagePercentage > 80
                        ? "bg-destructive"
                        : storagePercentage > 60
                          ? "bg-yellow-500"
                          : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your chat interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="gap-4 grid md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: any) =>
                      handleSettingChange("theme", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select
                    value={settings.fontSize}
                    onValueChange={(value: any) =>
                      handleSettingChange("fontSize", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Enable Animations</Label>
                    <p className="text-muted-foreground text-sm">
                      Smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={settings.animationsEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("animationsEnabled", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-muted-foreground text-sm">
                      Reduce spacing for more content
                    </p>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) =>
                      handleSettingChange("compactMode", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Show Timestamps</Label>
                    <p className="text-muted-foreground text-sm">
                      Display message timestamps
                    </p>
                  </div>
                  <Switch
                    checked={settings.showTimestamps}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showTimestamps", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Sound Notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Play sound when receiving messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("soundEnabled", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Desktop Notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Show browser notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("desktopNotifications", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive email updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", checked)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={(value: any) =>
                    handleSettingChange("notificationFrequency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your data privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention (days)</Label>
                <Select
                  value={settings.dataRetention.toString()}
                  onValueChange={(value) =>
                    handleSettingChange("dataRetention", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="-1">Forever</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Automatically delete messages older than this period
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Encrypt Messages</Label>
                    <p className="text-muted-foreground text-sm">
                      Encrypt stored messages locally
                    </p>
                  </div>
                  <Switch
                    checked={settings.encryptMessages}
                    onCheckedChange={(checked) =>
                      handleSettingChange("encryptMessages", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Share Analytics</Label>
                    <p className="text-muted-foreground text-sm">
                      Share anonymous usage data
                    </p>
                  </div>
                  <Switch
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) =>
                      handleSettingChange("shareAnalytics", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Third-party Integrations</Label>
                    <p className="text-muted-foreground text-sm">
                      Allow third-party app connections
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowThirdPartyIntegrations}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "allowThirdPartyIntegrations",
                        checked,
                      )
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="destructive"
                  onClick={clearAllData}
                  className="flex items-center gap-2 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </Button>
                <p className="text-muted-foreground text-xs text-center">
                  This will permanently delete all your chat data and settings
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export & Import Settings
              </CardTitle>
              <CardDescription>
                Backup and restore your settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <Select
                  value={settings.defaultExportFormat}
                  onValueChange={(value: any) =>
                    handleSettingChange("defaultExportFormat", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Include System Messages</Label>
                    <p className="text-muted-foreground text-sm">
                      Include system messages in exports
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeSystemMessages}
                    onCheckedChange={(checked) =>
                      handleSettingChange("includeSystemMessages", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Compress Exports</Label>
                    <p className="text-muted-foreground text-sm">
                      Compress export files to save space
                    </p>
                  </div>
                  <Switch
                    checked={settings.compressExports}
                    onCheckedChange={(checked) =>
                      handleSettingChange("compressExports", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button
                  onClick={exportSettings}
                  disabled={isExporting}
                  className="flex flex-1 items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Exporting..." : "Export Settings"}
                </Button>

                <div className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                    id="import-settings"
                    disabled={isImporting}
                  />
                  <Button
                    onClick={() =>
                      document.getElementById("import-settings")?.click()
                    }
                    disabled={isImporting}
                    variant="outline"
                    className="flex items-center gap-2 w-full"
                  >
                    <Upload className="w-4 h-4" />
                    {isImporting ? "Importing..." : "Import Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options for power users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="gap-4 grid md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiTimeout">API Timeout (ms)</Label>
                  <Input
                    id="apiTimeout"
                    type="number"
                    min="5000"
                    max="60000"
                    step="1000"
                    value={settings.apiTimeout}
                    onChange={(e) =>
                      handleSettingChange(
                        "apiTimeout",
                        parseInt(e.target.value) || 30000,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-muted-foreground text-sm">
                      Enable detailed logging and debugging
                    </p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) =>
                      handleSettingChange("debugMode", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Experimental Features</Label>
                    <p className="text-muted-foreground text-sm">
                      Enable beta features (may be unstable)
                    </p>
                  </div>
                  <Switch
                    checked={settings.experimentalFeatures}
                    onCheckedChange={(checked) =>
                      handleSettingChange("experimentalFeatures", checked)
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-muted-foreground text-sm">
                      Limit API request frequency
                    </p>
                  </div>
                  <Switch
                    checked={settings.rateLimitEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("rateLimitEnabled", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Custom Prompts</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a custom prompt..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCustomPrompt()}
                  />
                  <Button
                    onClick={addCustomPrompt}
                    disabled={!customPrompt.trim()}
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {settings.customPrompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span className="text-sm">{prompt}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCustomPrompt(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {settings.customPrompts.length === 0 && (
                    <p className="py-4 text-muted-foreground text-sm text-center">
                      No custom prompts added yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
