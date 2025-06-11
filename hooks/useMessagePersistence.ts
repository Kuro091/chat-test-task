import { useState, useEffect, useCallback } from "react";
import { ChatMessageType, ChatSession, HistoryError } from "@/types/chat";

const STORAGE_KEY = "chat-sessions";
const MAX_SESSIONS = 50;

interface UseMessagePersistenceReturn {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  error: HistoryError | null;
  isLoading: boolean;
  createSession: (title?: string) => Promise<string>;
  saveMessage: (
    message: Omit<ChatMessageType, "id" | "timestamp">,
  ) => Promise<void>;
  loadSession: (sessionId: string) => Promise<ChatSession | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  exportSession: (
    sessionId: string,
    format: "json" | "csv" | "txt",
  ) => Promise<string>;
}

export const useMessagePersistence = (): UseMessagePersistenceReturn => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
  const [error, setError] = useState<HistoryError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and load sessions from localStorage
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSessions: ChatSession[] = JSON.parse(stored).map(
            (session: any) => ({
              ...session,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
              messages: session.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            }),
          );
          setSessions(parsedSessions);
        }
        setError(null);
      } catch (err) {
        setError({
          type: "STORAGE_ERROR",
          message: "Failed to load chat history",
          details: err,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Save sessions to localStorage
  const saveSessions = useCallback(async (sessionsToSave: ChatSession[]) => {
    try {
      // Limit number of sessions to prevent storage bloat
      const limitedSessions = sessionsToSave
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, MAX_SESSIONS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSessions));
      setSessions(limitedSessions);
      setError(null);
    } catch (err) {
      setError({
        type: "STORAGE_ERROR",
        message: "Failed to save chat history",
        details: err,
      });
      throw err;
    }
  }, []);

  const createSession = useCallback(
    async (title?: string): Promise<string> => {
      const newSession: ChatSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title || `Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedSessions = [newSession, ...sessions];
      await saveSessions(updatedSessions);
      setCurrentSession(newSession);
      return newSession.id;
    },
    [sessions, saveSessions],
  );

  const saveMessage = useCallback(
    async (message: Omit<ChatMessageType, "id" | "timestamp">) => {
      if (!currentSession) {
        throw new Error("No active session");
      }

      const newMessage: ChatMessageType = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        sessionId: currentSession.id,
      };

      const updatedSession: ChatSession = {
        ...currentSession,
        messages: [...currentSession.messages, newMessage],
        updatedAt: new Date(),
      };

      const updatedSessions = sessions.map((s) =>
        s.id === currentSession.id ? updatedSession : s,
      );

      await saveSessions(updatedSessions);
      setCurrentSession(updatedSession);
    },
    [currentSession, sessions, saveSessions],
  );

  const loadSession = useCallback(
    async (sessionId: string): Promise<ChatSession | null> => {
      try {
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          setCurrentSession(session);
          return session;
        }
        return null;
      } catch (err) {
        setError({
          type: "STORAGE_ERROR",
          message: "Failed to load session",
          details: err,
        });
        return null;
      }
    },
    [sessions],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      await saveSessions(updatedSessions);

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    },
    [sessions, currentSession, saveSessions],
  );

  const clearAllSessions = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSessions([]);
      setCurrentSession(null);
      setError(null);
    } catch (err) {
      setError({
        type: "STORAGE_ERROR",
        message: "Failed to clear chat history",
        details: err,
      });
      throw err;
    }
  }, []);

  const exportSession = useCallback(
    async (
      sessionId: string,
      format: "json" | "csv" | "txt",
    ): Promise<string> => {
      try {
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        switch (format) {
          case "json":
            return JSON.stringify(session, null, 2);

          case "csv":
            const csvHeader = "Timestamp,Sender,Message,Type\n";
            const csvRows = session.messages
              .map(
                (msg) =>
                  `"${msg.timestamp.toISOString()}","${msg.sender}","${msg.message.replace(/"/g, '""')}","${msg.isAI ? "AI" : "User"}"`,
              )
              .join("\n");
            return csvHeader + csvRows;

          case "txt":
            return session.messages
              .map(
                (msg) =>
                  `[${msg.timestamp.toLocaleString()}] ${msg.sender}: ${msg.message}`,
              )
              .join("\n\n");

          default:
            throw new Error(`Unsupported format: ${format}`);
        }
      } catch (err) {
        setError({
          type: "EXPORT_ERROR",
          message: "Failed to export session",
          details: err,
        });
        throw err;
      }
    },
    [sessions],
  );

  return {
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
  };
};
