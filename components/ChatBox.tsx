import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NoteIcon,
  SparkleIcon,
  PaperclipIcon,
  SmileIcon,
  AtHandleIcon,
  SlashIcon,
  SparkleIconTwo,
} from "./icons";
import { Send } from "lucide-react";
import { ChatBoxProps } from "@/types/chat";

export function ChatBox({
  onSend,
  state = "Idle",
  reply = true,
  files = true,
  media = true,
}: ChatBoxProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[hsla(0,0%,100%,1)] shadow-[0px_0px_0px_1px_hsla(228,100%,11%,0.09),0px_1px_1px_-0.5px_hsla(219,22%,18%,0.03),0px_2px_2px_-1px_hsla(220,23%,16%,0.04),0px_3px_3px_-1.5px_hsla(221,20%,19%,0.04),0px_5px_5px_-2.5px_hsla(222,22%,18%,0.04),0px_10px_10px_-5px_hsla(220,22%,16%,0.04),0px_24px_24px_-8px_hsla(221,21%,23%,0.04),inset_0px_0px_0px_1px_hsla(0,0%,100%,0)] rounded-[12px] w-full">
      {/* Input and Icons Container */}
      <div className="flex flex-col gap-3 p-3">
        {/* Input Container */}
        <div className="flex items-center gap-3 px-2 py-3 h-11">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={state === "Typing" ? "Typing" : ""}
            spellCheck="false"
            className="flex-1 bg-transparent p-0 border-0 hover:border-0 focus:border-0 rounded-none focus-visible:outline-none focus:outline-none ring-0 hover:ring-0 focus-visible:ring-0 focus:ring-0 ring-offset-0 focus-visible:ring-offset-0 placeholder:text-neutral-alpha-11 decoration-0 no-underline resize-none"
          />
        </div>

        {/* Icons and Send Button Container */}
        <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 md:gap-0 px-1.5 min-h-8">
          {/* Left Container - Icons and Quick Reply */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto h-8">
            <div className="flex items-center gap-2 space-x-[6px]">
              <button className="hover:bg-transparent rounded-sm">
                <NoteIcon className="w-4 h-4 text-neutral-alpha-11 hover:text-black" />
              </button>
              <button className="hover:bg-transparent rounded-sm">
                <SparkleIcon className="w-4 h-4 text-neutral-alpha-11 hover:text-black" />
              </button>
              {files && (
                <button className="hover:bg-transparent rounded-sm">
                  <PaperclipIcon className="w-4 h-4 text-neutral-alpha-11 hover:text-black" />
                </button>
              )}
              {media && (
                <button className="hover:bg-transparent rounded-sm">
                  <SmileIcon className="w-4 h-4 text-neutral-alpha-11 hover:text-black" />
                </button>
              )}
              <button className="hover:bg-transparent rounded-sm">
                <AtHandleIcon className="w-4 h-4 text-neutral-alpha-11 hover:text-black" />
              </button>
              <button className="hover:bg-transparent rounded-sm">
                <SlashIcon className="w-4 h-4 text-neutral-alpha-11 hover:text-black" />
              </button>
            </div>

            {/* Separator and Quick Reply - Visible only on desktop */}
            <div className="hidden md:flex items-center">
              <div className="bg-[hsla(228,100%,11%,0.09)] mx-2 w-[1px] h-4" />
              <button className="flex items-center gap-1 px-2 py-1 rounded-sm font-inter text-[hsla(231,100%,1%,0.88)] hover:text-black text-small-500">
                <SparkleIconTwo className="w-3 h-3" />
                Quick reply with AI
              </button>
            </div>
          </div>

          {/* Right Container - Quick Reply (mobile) and Send Button */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Quick Reply - Visible only on mobile */}
            <button className="md:hidden flex items-center gap-1 order-2 px-2 py-1 rounded-sm font-inter text-[hsla(231,100%,1%,0.88)] hover:text-black text-small-500">
              <SparkleIconTwo className="w-3 h-3" />
              Quick reply with AI
            </button>

            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className="order-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 p-0 rounded-md w-8 h-8 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
