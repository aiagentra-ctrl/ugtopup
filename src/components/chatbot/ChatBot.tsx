import { useChatBot } from "@/hooks/useChatBot";
import { ChatBotButton } from "./ChatBotButton";
import { ChatBotWindow } from "./ChatBotWindow";

export const ChatBot = () => {
  const {
    messages,
    isOpen,
    isMinimized,
    isLoading,
    toggleChat,
    closeChat,
    minimizeChat,
    sendMessage,
    messagesEndRef
  } = useChatBot();

  return (
    <>
      <ChatBotButton isOpen={isOpen && !isMinimized} onClick={toggleChat} />
      <ChatBotWindow
        isOpen={isOpen}
        isMinimized={isMinimized}
        messages={messages}
        isLoading={isLoading}
        onClose={closeChat}
        onMinimize={minimizeChat}
        onSendMessage={sendMessage}
        messagesEndRef={messagesEndRef}
      />
    </>
  );
};
