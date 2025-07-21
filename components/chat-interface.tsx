"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatBox } from "./ChatBox";
import { MessageHistory } from "./MessageHistory";
import { ChatAnalytics } from "./ChatAnalytics";
import { ChatMessageType } from "@/types/chat";
import { useMessagePersistence } from "@/hooks/useMessagePersistence";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  History,
  MessageCircle,
  Plus,
  AlertCircle,
  BarChart3,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeTab, setActiveTab] = useState<
    "chat" | "history" | "analytics" | "search"
  >("chat");

  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // Simulating expensive calculation
    const count = messages.reduce((total, msg) => {
      return total + msg.message.length;
    }, 0);
    setMessageCount(count);
  }, [messages]);

  const {
    sessions,
    currentSession,
    error,
    isLoading,
    createSession,
    saveMessage,
    loadSession,
    deleteSession,
    clearAllSessions,
    exportSession,
  } = useMessagePersistence();

  const {
    searchResults,
    isSearching,
    searchStats,
    executeSearch,
    clearSearch,
    highlightText,
  } = useMessageSearch(sessions);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with a default session if none exists
  useEffect(() => {
    const initializeSession = async () => {
      if (!isLoading && sessions.length === 0) {
        try {
          await createSession("Welcome Chat");
        } catch (err) {
          console.error("Failed to create initial session:", err);
        }
      }
    };

    initializeSession();
  }, [isLoading, sessions.length, createSession]);

  // Load messages from current session
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
    } else {
      setMessages([
        {
          id: "default-welcome",
          isAI: true,
          message:
            "Oh no! Sad to hear that, but of course we can give a refund. Can you please provide your order number if you have one? Or email that you've used to make this purchase.",
          sender: "Vanilla AI",
          timestamp: new Date(),
        },
      ]);
    }
  }, [currentSession]);

  const handleSend = async (message: string) => {
    const newMessage: Omit<ChatMessageType, "id" | "timestamp"> = {
      message,
      isAI: false,
      sender: "You",
    };

    try {
      // Add message to UI immediately for better UX
      const tempMessage: ChatMessageType = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        timestamp: new Date(),
        sessionId: currentSession?.id,
      };
      setMessages((prev) => [...prev, tempMessage]);

      // Save to persistence
      if (currentSession) {
        await saveMessage(newMessage);
      }
    } catch (err) {
      console.error("Failed to save message:", err);
      // Remove the temporary message if save failed
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      setActiveTab("chat");
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleNewChat = async () => {
    try {
      await createSession();
      setActiveTab("chat");
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  const handleExportSession = async (
    sessionId: string,
    format: "json" | "csv" | "txt",
  ): Promise<string> => {
    try {
      return await exportSession(sessionId, format);
    } catch (err) {
      console.error("Failed to export session:", err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="text-center">
          <div className="mx-auto mb-2 border-b-2 border-blue-500 rounded-full w-8 h-8 animate-spin"></div>
          <p className="text-gray-500">Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "chat" | "history" | "analytics" | "search")
        }
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "history" && (
              <Button
                onClick={handleNewChat}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="chat" className="mt-0">
          <div className="flex flex-col items-stretch w-full h-[500px]">
            {/* Chat Header */}
            <div className="flex justify-between items-center bg-gray-50 p-3 border-b rounded-t-lg">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">
                  {currentSession?.title || "New Chat"}
                </h3>
                {messages.length > 1 && (
                  <span className="text-gray-500 text-sm">
                    ({messages.length} messages)
                  </span>
                )}
              </div>
              <Button
                onClick={handleNewChat}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col justify-end gap-4 p-4 min-h-full">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isAI ? "justify-start" : "justify-end"} w-full`}
                  >
                    <ChatMessage
                      isAI={msg.isAI}
                      message={msg.message}
                      sender={msg.sender}
                      onRegenerate={
                        msg.isAI ? () => console.log("Regenerate") : undefined
                      }
                      onReply={
                        msg.isAI ? () => console.log("Reply") : undefined
                      }
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed input at bottom */}
            <div className="flex-shrink-0">
              <ChatBox onSend={handleSend} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <MessageHistory
            sessions={sessions}
            onLoadSession={handleLoadSession}
            onDeleteSession={handleDeleteSession}
            onExportSession={handleExportSession}
            currentSessionId={currentSession?.id}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <ChatAnalytics sessions={sessions} />
        </TabsContent>

        <TabsContent value="search" className="mt-0">
          <div className="space-y-4">
            <div className="py-8 text-center">
              <Search className="mx-auto mb-3 w-12 h-12 text-gray-300" />
              <h3 className="mb-2 font-medium text-gray-900 text-lg">
                Advanced Search
              </h3>
              <p className="mb-4 text-gray-500">
                Search through all your conversations with advanced filters
              </p>
              <p className="text-muted-foreground text-sm">
                Found {searchStats.totalResults} results in{" "}
                {searchStats.searchTime}ms
                {searchResults.length > 0 &&
                  ` across ${searchStats.sessionsSearched} sessions`}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
