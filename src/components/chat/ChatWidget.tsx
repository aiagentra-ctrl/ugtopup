import { useChat } from '@/hooks/useChat';
import { FloatingButton } from './FloatingButton';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ChatWidget = () => {
  const {
    isOpen,
    toggleChat,
    closeChat,
    messages,
    inputValue,
    setInputValue,
    isTyping,
    sendMessage,
    messagesEndRef
  } = useChat();

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FloatingButton onClick={toggleChat} />
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed z-[9999] animate-in fade-in slide-in-from-bottom-8 duration-300
                     bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto
                     w-full md:w-[400px] 
                     h-[85vh] md:h-[600px] max-h-[600px]
                     rounded-t-2xl md:rounded-2xl
                     bg-background border border-border
                     shadow-2xl shadow-primary/20
                     flex flex-col overflow-hidden"
        >
          {/* Header */}
          <ChatHeader onClose={closeChat} />

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={sendMessage}
            disabled={isTyping}
          />
        </div>
      )}
    </>
  );
};
