import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatMessage as ChatMessageType } from "@/hooks/useChatBot";
import { cn } from "@/lib/utils";

interface ChatBotWindowProps {
  isOpen: boolean;
  messages: ChatMessageType[];
  isLoading: boolean;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatBotWindow = ({
  isOpen,
  messages,
  isLoading,
  onClose,
  onSendMessage,
  messagesEndRef
}: ChatBotWindowProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 right-5 md:bottom-24 md:right-6 z-40",
        "w-[calc(100vw-2rem)] max-h-[80vh] md:w-[400px] md:h-[600px]",
        "rounded-2xl shadow-2xl",
        "border border-white/20",
        "chat-window-enter",
        "flex flex-col overflow-hidden"
      )}
      style={{
        background: "rgba(20, 20, 20, 0.95)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 8px 40px rgba(231, 29, 54, 0.3), 0 0 80px rgba(231, 29, 54, 0.15)"
      }}
      role="dialog"
      aria-label="Chat support window"
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-3 border-b-2 flex-shrink-0"
        style={{
          background: "#1a1a1a",
          borderBottomColor: "rgba(231, 29, 54, 0.3)"
        }}
      >
        <img
          src="/logo.jpg"
          alt="UGC-Topup"
          className="w-8 h-8 rounded-lg object-cover"
        />
        <h3 className="text-white font-semibold text-base md:text-lg flex-1">
          UGC-Topup Chat Support 💬
        </h3>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 chat-scrollbar"
        style={{
          background: "transparent"
        }}
        aria-live="polite"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div 
              className="backdrop-blur-sm border px-4 py-3 rounded-2xl rounded-bl-md"
              style={{
                background: "#2a2a2a",
                borderColor: "rgba(255, 255, 255, 0.1)"
              }}
            >
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-sm mr-2">Typing</span>
                <div className="flex gap-1">
                  <span 
                    className="w-2 h-2 rounded-full animate-typing-dot" 
                    style={{ 
                      backgroundColor: "#E71D36",
                      animationDelay: '0ms' 
                    }} 
                  />
                  <span 
                    className="w-2 h-2 rounded-full animate-typing-dot" 
                    style={{ 
                      backgroundColor: "#E71D36",
                      animationDelay: '150ms' 
                    }} 
                  />
                  <span 
                    className="w-2 h-2 rounded-full animate-typing-dot" 
                    style={{ 
                      backgroundColor: "#E71D36",
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
        className="p-4 border-t-2 flex-shrink-0"
        style={{
          background: "#1a1a1a",
          borderTopColor: "rgba(255, 255, 255, 0.1)"
        }}
      >
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={cn(
              "flex-1 px-4 py-3 rounded-xl",
              "backdrop-blur-sm border-2",
              "text-white placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "text-sm md:text-base transition-all"
            )}
            style={{ 
              background: "#2a2a2a",
              borderColor: "rgba(255, 255, 255, 0.15)",
              fontSize: window.innerWidth < 640 ? '16px' : undefined
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              "transition-all duration-300 shadow-lg",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:scale-105 active:scale-95 hover:shadow-xl"
            )}
            style={{
              background: !inputValue.trim() || isLoading 
                ? "#666" 
                : "linear-gradient(to right, #E71D36, #FF004D)",
              boxShadow: !inputValue.trim() || isLoading 
                ? "none" 
                : "0 4px 20px rgba(231, 29, 54, 0.4)"
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
