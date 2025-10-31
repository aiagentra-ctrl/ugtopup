import { Message } from '@/hooks/useChat';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[70%] px-4 py-3 break-words ${
          isUser
            ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl rounded-br-md shadow-lg shadow-primary/30'
            : 'bg-card text-card-foreground border border-border rounded-2xl rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </div>
      <span className="text-xs text-muted-foreground mt-1 px-2">
        {format(message.timestamp, 'h:mm a')}
      </span>
    </div>
  );
};
