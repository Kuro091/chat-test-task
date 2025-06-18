import { ChatMessageType, ChatSession } from "@/types/chat";

export interface ChatApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimitPerMinute: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface SendMessageRequest {
  message: string;
  sessionId: string;
  context?: ChatMessageType[];
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

export interface SendMessageResponse {
  message: ChatMessageType;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}

class ChatApiError extends Error {
  public statusCode: number;
  public requestId?: string;
  public rateLimitInfo?: RateLimitInfo;

  constructor(
    message: string,
    statusCode: number,
    requestId?: string,
    rateLimitInfo?: RateLimitInfo,
  ) {
    super(message);
    this.name = "ChatApiError";
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.rateLimitInfo = rateLimitInfo;
  }
}

export class ChatApiClient {
  private config: ChatApiConfig;
  private requestQueue: Array<{ timestamp: number; promise: Promise<any> }> =
    [];
  private lastRequestTime = 0;
  private consecutiveErrors = 0;

  constructor(config: ChatApiConfig) {
    this.config = config;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old requests from queue
    this.requestQueue = this.requestQueue.filter(
      (req) => req.timestamp > oneMinuteAgo,
    );

    // Check if we're at the rate limit
    if (this.requestQueue.length >= this.config.rateLimitPerMinute) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = 60000 - (now - oldestRequest.timestamp);
      if (waitTime > 0) {
        await this.delay(waitTime);
      }
    }

    // Ensure minimum time between requests (100ms)
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 100) {
      await this.delay(100 - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    attempt = 1,
  ): Promise<ApiResponse<T>> {
    await this.enforceRateLimit();

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = `${this.config.baseUrl}/${endpoint}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...((options.headers as Record<string, string>) || {}),
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const requestPromise = fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // Add to rate limit queue
      this.requestQueue.push({
        timestamp: Date.now(),
        promise: requestPromise,
      });

      const response = await requestPromise;
      const processingTime = performance.now() - startTime;

      clearTimeout(timeoutId);

      // Parse rate limit headers
      const rateLimitInfo: RateLimitInfo | undefined = response.headers.get(
        "X-RateLimit-Remaining",
      )
        ? {
            remaining: parseInt(
              response.headers.get("X-RateLimit-Remaining") || "0",
            ),
            resetTime: parseInt(
              response.headers.get("X-RateLimit-Reset") || "0",
            ),
            limit: parseInt(response.headers.get("X-RateLimit-Limit") || "0"),
          }
        : undefined;

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }

        // Handle rate limiting
        if (response.status === 429) {
          if (attempt <= this.config.retryAttempts) {
            const retryAfter =
              parseInt(response.headers.get("Retry-After") || "0") * 1000;
            const delayTime = Math.max(
              retryAfter,
              this.config.retryDelay * Math.pow(2, attempt - 1),
            );

            console.warn(
              `Rate limited, retrying after ${delayTime}ms (attempt ${attempt})`,
            );
            await this.delay(delayTime);
            return this.makeRequest<T>(endpoint, options, attempt + 1);
          }
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt <= this.config.retryAttempts) {
          const delayTime = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Server error, retrying after ${delayTime}ms (attempt ${attempt})`,
          );
          await this.delay(delayTime);
          return this.makeRequest<T>(endpoint, options, attempt + 1);
        }

        throw new ChatApiError(
          errorMessage,
          response.status,
          requestId,
          rateLimitInfo,
        );
      }

      const data = await response.json();
      this.consecutiveErrors = 0; // Reset error counter on success

      return {
        data,
        success: true,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Math.round(processingTime),
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.consecutiveErrors++;

      if (error instanceof ChatApiError) {
        throw error;
      }

      // Handle network errors with retry
      if ((error as Error).name === "AbortError") {
        throw new ChatApiError("Request timeout", 408, requestId);
      }

      if (attempt <= this.config.retryAttempts && this.consecutiveErrors < 5) {
        const delayTime = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Network error, retrying after ${delayTime}ms (attempt ${attempt})`,
        );
        await this.delay(delayTime);
        return this.makeRequest<T>(endpoint, options, attempt + 1);
      }

      throw new ChatApiError(
        `Network error: ${(error as Error).message}`,
        0,
        requestId,
      );
    }
  }

  async sendMessage(
    request: SendMessageRequest,
  ): Promise<ApiResponse<SendMessageResponse>> {
    const requestBody = {
      message: request.message,
      sessionId: request.sessionId,
      context: request.context?.slice(-10), // Only send last 10 messages for context
      options: {
        temperature: 0.7,
        maxTokens: 1000,
        stream: false,
        ...request.options,
      },
    };

    return this.makeRequest<SendMessageResponse>("chat/send", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  async getSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return this.makeRequest<ChatSession>(`chat/sessions/${sessionId}`, {
      method: "GET",
    });
  }

  async createSession(
    title?: string,
  ): Promise<ApiResponse<{ sessionId: string }>> {
    return this.makeRequest<{ sessionId: string }>("chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  async deleteSession(
    sessionId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(
      `chat/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    );
  }

  async getSessions(
    limit = 50,
    offset = 0,
  ): Promise<ApiResponse<{ sessions: ChatSession[]; total: number }>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.makeRequest<{ sessions: ChatSession[]; total: number }>(
      `chat/sessions?${params}`,
      {
        method: "GET",
      },
    );
  }

  async regenerateMessage(
    sessionId: string,
    messageId: string,
  ): Promise<ApiResponse<SendMessageResponse>> {
    return this.makeRequest<SendMessageResponse>(
      `chat/sessions/${sessionId}/messages/${messageId}/regenerate`,
      {
        method: "POST",
      },
    );
  }

  async getUsage(): Promise<
    ApiResponse<{
      tokensUsed: number;
      requestsCount: number;
      rateLimitInfo: RateLimitInfo;
    }>
  > {
    return this.makeRequest("chat/usage", {
      method: "GET",
    });
  }

  async exportSession(
    sessionId: string,
    format: "json" | "csv" | "txt",
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.makeRequest<{ downloadUrl: string }>(
      `chat/sessions/${sessionId}/export`,
      {
        method: "POST",
        body: JSON.stringify({ format }),
      },
    );
  }

  // Streaming message support
  async sendMessageStream(
    request: SendMessageRequest,
    onChunk: (chunk: string) => void,
    onComplete: (message: ChatMessageType) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const streamRequest = {
        ...request,
        options: { ...request.options, stream: true },
      };
      const response = await fetch(`${this.config.baseUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        body: JSON.stringify(streamRequest),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let completeMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              const finalMessage: ChatMessageType = {
                id: `msg_${Date.now()}`,
                message: completeMessage,
                isAI: true,
                sender: "AI Assistant",
                timestamp: new Date(),
              };
              onComplete(finalMessage);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.delta?.content) {
                completeMessage += parsed.delta.content;
                onChunk(parsed.delta.content);
              }
            } catch (parseError) {
              console.warn("Failed to parse stream chunk:", parseError);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    return this.makeRequest<{ status: string; timestamp: string }>("health", {
      method: "GET",
    });
  }

  // Update configuration
  updateConfig(newConfig: Partial<ChatApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current rate limit status
  getRateLimitStatus(): { queueLength: number; lastRequestTime: number } {
    const now = Date.now();
    const recentRequests = this.requestQueue.filter(
      (req) => req.timestamp > now - 60000,
    );

    return {
      queueLength: recentRequests.length,
      lastRequestTime: this.lastRequestTime,
    };
  }
}

// Default configuration
export const defaultApiConfig: ChatApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.example.com",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  rateLimitPerMinute: 60,
};

// Singleton instance
let apiClientInstance: ChatApiClient | null = null;

export const getChatApiClient = (
  config?: Partial<ChatApiConfig>,
): ChatApiClient => {
  if (!apiClientInstance) {
    apiClientInstance = new ChatApiClient({ ...defaultApiConfig, ...config });
  }
  return apiClientInstance;
};

export { ChatApiError };
