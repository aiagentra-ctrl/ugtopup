import { ChatMessage as ChatMessageType } from "@/hooks/useChatBot";
import { cn } from "@/lib/utils";
import { QuickReplyButtons } from "./QuickReplyButtons";

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickReply?: (reply: string) => void;
  isLoading?: boolean;
}

export const ChatMessage = ({ message, onQuickReply, isLoading }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isUser ? "justify-end" : "justify-start flex-col items-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] px-4 py-3 text-sm break-words animate-slide-in",
          isUser
            ? "text-white rounded-2xl rounded-br-md"
            : "text-[#374151] rounded-2xl rounded-bl-md"
        )}
        style={
          isUser
            ? {
                background: "#1e3a5f",
              }
            : {
                background: "#f3f4f6",
              }
        }
      >
        {message.content}
      </div>
      
      {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
        <div className="max-w-[75%]">
          <QuickReplyButtons 
            replies={message.quickReplies}
            onReplyClick={onQuickReply || (() => {})}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
};
