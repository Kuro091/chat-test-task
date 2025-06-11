export interface ChatMessageType {
  id: string;
  message: string;
  isAI: boolean;
  sender: string;
  timestamp: Date;
  sessionId?: string;
}

export interface ChatBoxProps {
  onSend: (message: string) => void;
  state?: ChatBoxState;
  reply?: boolean;
  files?: boolean;
  media?: boolean;
}

export type ChatBoxState = "Typing" | "Idle" | "Sending" | "Error";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessageType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageHistoryFilters {
  searchQuery?: string;
  sender?: "all" | "user" | "ai";
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportOptions {
  format: "json" | "csv" | "txt";
  includeTimestamps: boolean;
  includeMetadata: boolean;
}

export type HistoryError = {
  type: "STORAGE_ERROR" | "EXPORT_ERROR" | "SEARCH_ERROR";
  message: string;
  details?: unknown;
};
