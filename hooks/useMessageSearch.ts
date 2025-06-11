import { useState, useMemo, useCallback } from "react";
import { ChatSession, ChatMessageType } from "@/types/chat";

interface SearchFilters {
  query: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  senderType?: "all" | "user" | "ai";
  messageLength?: {
    min: number;
    max: number;
  };
  sortBy?: "relevance" | "date" | "length";
  sortOrder?: "asc" | "desc";
}

interface SearchResult {
  session: ChatSession;
  message: ChatMessageType;
  relevanceScore: number;
  matchedTerms: string[];
  context: {
    before: ChatMessageType[];
    after: ChatMessageType[];
  };
}

interface UseMessageSearchReturn {
  searchResults: SearchResult[];
  isSearching: boolean;
  searchStats: {
    totalResults: number;
    searchTime: number;
    sessionsSearched: number;
  };
  executeSearch: (filters: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  highlightText: (text: string, query: string) => string;
}

export const useMessageSearch = (
  sessions: ChatSession[],
): UseMessageSearchReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
    sessionsSearched: 0,
  });

  // Tokenize and normalize text for better search
  const tokenizeText = useCallback((text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }, []);

  // Calculate relevance score based on multiple factors
  const calculateRelevanceScore = useCallback(
    (
      message: ChatMessageType,
      queryTokens: string[],
      matchedTerms: string[],
    ): number => {
      const messageTokens = tokenizeText(message.message);
      let score = 0;

      // Exact phrase matches get highest score
      queryTokens.forEach((token) => {
        if (message.message.toLowerCase().includes(token)) {
          score += 10;
        }
      });

      // Token matches in message
      matchedTerms.forEach((term) => {
        const termCount = messageTokens.filter((token) =>
          token.includes(term),
        ).length;
        score += termCount * 5;
      });

      // Boost score for shorter messages (more concentrated relevance)
      if (message.message.length < 100) score *= 1.2;
      if (message.message.length < 50) score *= 1.5;

      // Boost score for user messages (often more specific)
      if (!message.isAI) score *= 1.1;

      // Recent messages get slight boost
      const daysSinceMessage =
        (Date.now() - message.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceMessage < 7) score *= 1.1;

      return score;
    },
    [tokenizeText],
  );

  // Get message context (surrounding messages)
  const getMessageContext = useCallback(
    (session: ChatSession, messageIndex: number, contextSize: number = 2) => {
      const before = session.messages.slice(
        Math.max(0, messageIndex - contextSize),
        messageIndex,
      );
      const after = session.messages.slice(
        messageIndex + 1,
        Math.min(session.messages.length, messageIndex + 1 + contextSize),
      );

      return { before, after };
    },
    [],
  );

  // Advanced search with fuzzy matching and ranking
  const executeSearch = useCallback(
    async (filters: SearchFilters) => {
      if (!filters.query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const startTime = performance.now();

      try {
        const queryTokens = tokenizeText(filters.query);
        const results: SearchResult[] = [];

        sessions.forEach((session) => {
          // Filter sessions by date if specified
          if (filters.dateRange) {
            const sessionDate = session.createdAt;
            if (
              sessionDate < filters.dateRange.start ||
              sessionDate > filters.dateRange.end
            ) {
              return;
            }
          }

          session.messages.forEach((message, messageIndex) => {
            // Filter by sender type
            if (filters.senderType === "user" && message.isAI) return;
            if (filters.senderType === "ai" && !message.isAI) return;

            // Filter by message length
            if (filters.messageLength) {
              const length = message.message.length;
              if (
                length < filters.messageLength.min ||
                length > filters.messageLength.max
              ) {
                return;
              }
            }

            // Search in message content
            const messageTokens = tokenizeText(message.message);
            const matchedTerms: string[] = [];

            // Find matching terms
            queryTokens.forEach((queryToken) => {
              messageTokens.forEach((messageToken) => {
                // Exact match
                if (messageToken === queryToken) {
                  matchedTerms.push(queryToken);
                }
                // Fuzzy match (starts with or contains)
                else if (
                  messageToken.includes(queryToken) ||
                  queryToken.includes(messageToken)
                ) {
                  if (Math.abs(messageToken.length - queryToken.length) <= 2) {
                    matchedTerms.push(queryToken);
                  }
                }
              });
            });

            // Also check for exact phrase matches
            if (
              message.message
                .toLowerCase()
                .includes(filters.query.toLowerCase())
            ) {
              matchedTerms.push(filters.query);
            }

            if (matchedTerms.length > 0) {
              const relevanceScore = calculateRelevanceScore(
                message,
                queryTokens,
                matchedTerms,
              );
              const context = getMessageContext(session, messageIndex);

              results.push({
                session,
                message,
                relevanceScore,
                matchedTerms: [...new Set(matchedTerms)],
                context,
              });
            }
          });
        });

        // Sort results
        results.sort((a, b) => {
          switch (filters.sortBy) {
            case "date":
              const dateComparison =
                filters.sortOrder === "asc"
                  ? a.message.timestamp.getTime() -
                    b.message.timestamp.getTime()
                  : b.message.timestamp.getTime() -
                    a.message.timestamp.getTime();
              return dateComparison;

            case "length":
              const lengthComparison =
                filters.sortOrder === "asc"
                  ? a.message.message.length - b.message.message.length
                  : b.message.message.length - a.message.message.length;
              return lengthComparison;

            case "relevance":
            default:
              return b.relevanceScore - a.relevanceScore;
          }
        });

        const endTime = performance.now();

        setSearchResults(results);
        setSearchStats({
          totalResults: results.length,
          searchTime: Math.round(endTime - startTime),
          sessionsSearched: sessions.length,
        });
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [sessions, tokenizeText, calculateRelevanceScore, getMessageContext],
  );

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchStats({
      totalResults: 0,
      searchTime: 0,
      sessionsSearched: 0,
    });
  }, []);

  // Highlight matched terms in text
  const highlightText = useCallback(
    (text: string, query: string): string => {
      if (!query.trim()) return text;

      const queryTokens = tokenizeText(query);
      let highlightedText = text;

      queryTokens.forEach((token) => {
        const regex = new RegExp(`(${token})`, "gi");
        highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
      });

      // Also highlight exact phrase
      if (query.length > 3) {
        const exactRegex = new RegExp(
          `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi",
        );
        highlightedText = highlightedText.replace(
          exactRegex,
          "<mark>$1</mark>",
        );
      }

      return highlightedText;
    },
    [tokenizeText],
  );

  return {
    searchResults,
    isSearching,
    searchStats,
    executeSearch,
    clearSearch,
    highlightText,
  };
};
