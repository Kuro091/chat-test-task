export interface ChatMessageType {
  message: string;
  isAI: boolean;
  sender: string;
}

export interface ChatBoxProps {
  onSend: (message: string) => void;
  state?: ChatBoxState;
  reply?: boolean;
  files?: boolean;
  media?: boolean;
}

export type ChatBoxState = "Typing" | "Idle" | "Sending" | "Error";
