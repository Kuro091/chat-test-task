import { ChatMessageType, ChatSession } from "@/types/chat";

/**
 * Validates a chat message object
 */
export const validateMessage = (
  message: Partial<ChatMessageType>,
): message is ChatMessageType => {
  return !!(
    message.id &&
    message.message &&
    typeof message.isAI === "boolean" &&
    message.sender &&
    message.timestamp instanceof Date
  );
};

/**
 * Validates a chat session object
 */
export const validateSession = (
  session: Partial<ChatSession>,
): session is ChatSession => {
  return !!(
    session.id &&
    session.title &&
    Array.isArray(session.messages) &&
    session.createdAt instanceof Date &&
    session.updatedAt instanceof Date
  );
};

/**
 * Generates a unique message ID
 */
export const generateMessageId = (): string => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generates a unique session ID
 */
export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitizes message content for safe storage and display
 */
export const sanitizeMessage = (message: string): string => {
  return message.trim().replace(/\n\s*\n\s*\n/g, "\n\n"); // Remove excessive line breaks
};

/**
 * Calculates session statistics
 */
export const getSessionStats = (session: ChatSession) => {
  const userMessages = session.messages.filter((msg) => !msg.isAI).length;
  const aiMessages = session.messages.filter((msg) => msg.isAI).length;
  const totalCharacters = session.messages.reduce(
    (sum, msg) => sum + msg.message.length,
    0,
  );
  const averageMessageLength =
    session.messages.length > 0
      ? Math.round(totalCharacters / session.messages.length)
      : 0;

  return {
    userMessages,
    aiMessages,
    totalMessages: session.messages.length,
    totalCharacters,
    averageMessageLength,
    duration: session.updatedAt.getTime() - session.createdAt.getTime(),
  };
};

/**
 * Searches messages within a session
 */
export const searchMessagesInSession = (
  session: ChatSession,
  query: string,
  caseSensitive: boolean = false,
): ChatMessageType[] => {
  const searchTerm = caseSensitive ? query : query.toLowerCase();

  return session.messages.filter((message) => {
    const messageText = caseSensitive
      ? message.message
      : message.message.toLowerCase();
    const senderText = caseSensitive
      ? message.sender
      : message.sender.toLowerCase();

    return messageText.includes(searchTerm) || senderText.includes(searchTerm);
  });
};

/**
 * Formats a session for export based on format type
 */
export const formatSessionForExport = (
  session: ChatSession,
  format: "json" | "csv" | "txt",
): string => {
  switch (format) {
    case "json":
      return JSON.stringify(
        {
          ...session,
          exportedAt: new Date().toISOString(),
          stats: getSessionStats(session),
        },
        null,
        2,
      );

    case "csv":
      const csvHeader = "Timestamp,Sender,Message,Type,Session Title\n";
      const csvRows = session.messages
        .map((msg) => {
          const escapedMessage = msg.message
            .replace(/"/g, '""')
            .replace(/\n/g, " ");
          const escapedSender = msg.sender.replace(/"/g, '""');
          const escapedTitle = session.title.replace(/"/g, '""');

          return `"${msg.timestamp.toISOString()}","${escapedSender}","${escapedMessage}","${msg.isAI ? "AI" : "User"}","${escapedTitle}"`;
        })
        .join("\n");
      return csvHeader + csvRows;

    case "txt":
      const header = `Chat Session: ${session.title}\nExported: ${new Date().toLocaleString()}\nMessages: ${session.messages.length}\n\n${"="}.repeat(50)\n\n`;
      const messages = session.messages
        .map(
          (msg) =>
            `[${msg.timestamp.toLocaleString()}] ${msg.sender}:\n${msg.message}\n`,
        )
        .join("\n");
      const footer = `\n${"="}.repeat(50)\nEnd of chat session`;
      return header + messages + footer;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Estimates storage size in bytes for a session
 */
export const estimateStorageSize = (session: ChatSession): number => {
  return JSON.stringify(session).length * 2; // Rough estimate (UTF-16)
};

/**
 * Checks if localStorage quota is approaching limits
 */
export const checkStorageQuota = (): {
  used: number;
  available: number;
  percentage: number;
} => {
  try {
    // Rough estimation method
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
    const total = 5 * 1024 * 1024; // 5MB in bytes
    const available = total - used;
    const percentage = (used / total) * 100;

    return { used, available, percentage };
  } catch (error) {
    return { used: 0, available: 0, percentage: 0 };
  }
};
