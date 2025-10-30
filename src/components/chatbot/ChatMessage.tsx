import { ChatMessage as ChatMessageType } from "@/hooks/useChatBot";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={cn(
        "flex w-full mb-3 animate-slide-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] px-4 py-3 rounded-2xl text-sm md:text-base font-medium break-words shadow-md",
          isUser
            ? "text-white rounded-br-md"
            : "border rounded-bl-md"
        )}
        style={
          isUser
            ? {
                background: "linear-gradient(to right, #E71D36, #FF004D)",
              }
            : {
                background: "#2a2a2a",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: "#f3f4f6"
              }
        }
      >
        {message.content}
      </div>
    </div>
  );
};
