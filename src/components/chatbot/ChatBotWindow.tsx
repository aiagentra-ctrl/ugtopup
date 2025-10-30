import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage as ChatMessageType } from "@/hooks/useChatBot";
import { cn } from "@/lib/utils";

interface ChatBotWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessageType[];
  isLoading: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSendMessage: (content: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatBotWindow = ({
  isOpen,
  isMinimized,
  messages,
  isLoading,
  onClose,
  onMinimize,
  onSendMessage,
  messagesEndRef
}: ChatBotWindowProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!isLoading) {
      onSendMessage(reply);
    }
  };

  if (!isOpen || isMinimized) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-[9999]",
        "w-full h-[90vh] md:w-[420px] md:h-[650px]",
        "md:bottom-6 md:right-6",
        "rounded-t-2xl md:rounded-2xl shadow-2xl",
        "border",
        "chat-window-enter",
        "flex flex-col overflow-hidden"
      )}
      style={{
        background: "#ffffff",
        borderColor: "#e5e7eb",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)"
      }}
      role="dialog"
      aria-label="Chat support window"
    >
      {/* Header */}
      <ChatHeader onMinimize={onMinimize} onClose={onClose} />

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-5 chat-scrollbar"
        style={{
          background: "#ffffff"
        }}
        aria-live="polite"
      >
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onQuickReply={handleQuickReply}
            isLoading={isLoading}
          />
        ))}
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div 
              className="px-4 py-3 rounded-2xl rounded-bl-md"
              style={{
                background: "#f3f4f6"
              }}
            >
              <div className="flex items-center gap-1">
                <span className="text-[#6b7280] text-sm mr-2">Typing</span>
                <div className="flex gap-1">
                  <span 
                    className="w-2 h-2 rounded-full animate-typing-dot" 
                    style={{ 
                      backgroundColor: "#9ca3af",
                      animationDelay: '0ms' 
                    }} 
                  />
                  <span 
                    className="w-2 h-2 rounded-full animate-typing-dot" 
                    style={{ 
                      backgroundColor: "#9ca3af",
                      animationDelay: '150ms' 
                    }} 
                  />
                  <span 
                    className="w-2 h-2 rounded-full animate-typing-dot" 
                    style={{ 
                      backgroundColor: "#9ca3af",
                      animationDelay: '300ms' 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className="p-4 border-t flex-shrink-0"
        style={{
          background: "#f9fafb",
          borderTopColor: "#e5e7eb"
        }}
      >
        <div className="flex gap-2 items-center">
          <button
            className="w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-white flex-shrink-0"
            aria-label="Add emoji"
            style={{ color: "#6b7280" }}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-white flex-shrink-0"
            aria-label="Attach file"
            style={{ color: "#6b7280" }}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your message..."
            className={cn(
              "flex-1 px-4 py-2.5 rounded-full border text-[#111827]",
              "placeholder:text-[#9ca3af]",
              "focus:outline-none focus:border-[#1e3a5f]",
              "text-sm transition-all"
            )}
            style={{ 
              background: "#ffffff",
              borderColor: "#e5e7eb",
              fontSize: window.innerWidth < 640 ? '16px' : '14px'
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0",
              "transition-all duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:scale-105 active:scale-95"
            )}
            style={{
              background: !inputValue.trim() || isLoading 
                ? "#d1d5db" 
                : "#1e3a5f",
              boxShadow: !inputValue.trim() || isLoading 
                ? "none" 
                : "0 2px 8px rgba(30, 58, 95, 0.2)"
            }}
            aria-label="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
