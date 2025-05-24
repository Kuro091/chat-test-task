"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatBox } from "./ChatBox";
import { ChatMessageType } from "@/types/chat";

export default function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      isAI: true,
      message:
        "Oh no! Sad to hear that, but of course we can give a refund. Can you please provide your order number if you have one? Or email that you've used to make this purchase.",
      sender: "Vanilla AI",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        message,
        isAI: false,
        sender: "You",
      },
    ]);
  };

  return (
    <div className="flex flex-col items-stretch w-full h-[500px]">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col justify-end gap-4 min-h-full">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isAI ? "justify-start" : "justify-end"} w-full`}
            >
              <ChatMessage
                isAI={msg.isAI}
                message={msg.message}
                sender={msg.sender}
                onRegenerate={
                  msg.isAI ? () => console.log("Regenerate") : undefined
                }
                onReply={msg.isAI ? () => console.log("Reply") : undefined}
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
  );
}
