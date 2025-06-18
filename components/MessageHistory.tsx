"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Trash2,
  Calendar,
  MessageSquare,
  User,
  Bot,
} from "lucide-react";
import {
  ChatSession,
  MessageHistoryFilters,
  ExportOptions,
} from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface MessageHistoryProps {
  sessions: ChatSession[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportSession: (
    sessionId: string,
    format: "json" | "csv" | "txt",
  ) => Promise<string>;
  currentSessionId?: string;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({
  sessions,
  onLoadSession,
  onDeleteSession,
  onExportSession,
  currentSessionId,
}) => {
  const [filters, setFilters] = useState<MessageHistoryFilters>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedSessionForExport, setSelectedSessionForExport] = useState<
    string | null
  >(null);
  const [isExporting, setIsExporting] = useState(false);

  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const filtered = sessions.filter((session) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = session.title.toLowerCase().includes(query);
        const matchesMessages = session.messages.some(
          (msg) =>
            msg.message.toLowerCase().includes(query) ||
            msg.sender.toLowerCase().includes(query),
        );
        if (!matchesTitle && !matchesMessages) return false;
      }

      // Sender filter
      if (filters.sender && filters.sender !== "all") {
        const hasRelevantMessages = session.messages.some((msg) =>
          filters.sender === "ai" ? msg.isAI : !msg.isAI,
        );
        if (!hasRelevantMessages) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const sessionDate = session.createdAt;
        if (
          sessionDate < filters.dateRange.start ||
          sessionDate > filters.dateRange.end
        ) {
          return false;
        }
      }

      return true;
    });
    setFilteredSessions(filtered);
  }, [sessions, filters]);

  const handleExport = async (format: "json" | "csv" | "txt") => {
    if (!selectedSessionForExport) return;

    try {
      setIsExporting(true);
      const exportData = await onExportSession(
        selectedSessionForExport,
        format,
      );

      // Create and trigger download
      const blob = new Blob([exportData], {
        type: format === "json" ? "application/json" : "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-session-${selectedSessionForExport}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDialogOpen(false);
      setSelectedSessionForExport(null);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const openExportDialog = (sessionId: string) => {
    setSelectedSessionForExport(sessionId);
    setExportDialogOpen(true);
  };

  const getSessionStats = (session: ChatSession) => {
    const userMessages = session.messages.filter((msg) => !msg.isAI).length;
    const aiMessages = session.messages.filter((msg) => msg.isAI).length;
    return { userMessages, aiMessages, total: session.messages.length };
  };

  return (
    <div className="flex flex-col space-y-4 bg-white shadow-sm p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900 text-xl">Message History</h2>
        <Badge variant="secondary" className="text-sm">
          {filteredSessions.length} session
          {filteredSessions.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex sm:flex-row flex-col gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
            <Input
              placeholder="Search messages, titles, or senders..."
              value={filters.searchQuery || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>

        <Select
          value={filters.sender || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              sender: value as "all" | "user" | "ai",
            }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by sender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="user">User Only</SelectItem>
            <SelectItem value="ai">AI Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="py-8 text-gray-500 text-center">
              <MessageSquare className="mx-auto mb-3 w-12 h-12 text-gray-300" />
              <p>No chat sessions found</p>
              <p className="text-sm">
                Start a conversation to see your chat history
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const stats = getSessionStats(session);
              const isCurrentSession = currentSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                    isCurrentSession
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => onLoadSession(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {session.title}
                        </h3>
                        {isCurrentSession && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-2 text-gray-500 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {session.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {stats.total} messages
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-400 text-xs">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {stats.userMessages}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {stats.aiMessages}
                        </div>
                      </div>

                      {session.messages.length > 0 && (
                        <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                          {
                            session.messages[session.messages.length - 1]
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExportDialog(session.id);
                        }}
                        className="p-0 w-8 h-8"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              "Are you sure you want to delete this chat session?",
                            )
                          ) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-0 w-8 h-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Chat Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Choose a format to export your chat session:
            </p>
            <div className="gap-2 grid">
              <Button
                onClick={() => handleExport("json")}
                disabled={isExporting}
                variant="outline"
                className="justify-start"
              >
                <Download className="mr-2 w-4 h-4" />
                JSON (Structured data)
              </Button>
              <Button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                variant="outline"
                className="justify-start"
              >
                <Download className="mr-2 w-4 h-4" />
                CSV (Spreadsheet compatible)
              </Button>
              <Button
                onClick={() => handleExport("txt")}
                disabled={isExporting}
                variant="outline"
                className="justify-start"
              >
                <Download className="mr-2 w-4 h-4" />
                TXT (Plain text)
              </Button>
            </div>
            {isExporting && (
              <p className="text-gray-500 text-sm text-center">
                Exporting... Please wait.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
