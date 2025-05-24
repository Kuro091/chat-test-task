import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  isAI?: boolean;
  message: string;
  sender: string;
  timestamp?: string;
  onRegenerate?: () => void;
  onReply?: () => void;
  className?: string;
}

export function ChatMessage({
  isAI = false,
  message,
  sender,
  timestamp,
  onRegenerate,
  onReply,
  className,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "rounded-12 p-3 border font-inter space-y-1 min-w-28",
        isAI
          ? "bg-accent-alpha border-accent/10"
          : "bg-white border-gray-100 text-right",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap justify-between items-start gap-2",
          isAI ? "justify-start" : "justify-end",
        )}
      >
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-gray-900 text-medium-500">{sender}</span>
          {isAI && (
            <span className="px-2 py-0.5 text-neutral-9 text-small-500">
              Suggested
            </span>
          )}
        </div>
        {isAI && onRegenerate && (
          <button
            onClick={onRegenerate}
            className="inline-flex items-center px-2 py-0 h-auto text-gray-600 hover:text-gray-900 text-small-500 shrink-0"
          >
            <RotateCcw className="mr-1 w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>

      <p className="text-gray-800 text-medium-regular">{message}</p>

      {onReply && (
        <button
          onClick={onReply}
          className="text-medium-500 text-neutral-alpha-12 hover:text-black underline"
        >
          Reply with this message
        </button>
      )}
    </div>
  );
}
