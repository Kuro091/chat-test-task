import ChatInterface from "@/components/chat-interface";

export default function Home() {
  return (
    <div className="place-items-center grid bg-gray-50 p-4 min-h-screen">
      <div className="mx-auto max-w-4xl">
        <ChatInterface />
      </div>
    </div>
  );
}
