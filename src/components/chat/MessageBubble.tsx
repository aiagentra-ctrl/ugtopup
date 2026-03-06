import { Message } from '@/hooks/useChat';
import { ProductCardBubble } from './ProductCardBubble';
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

      {/* Product card(s) */}
      {!isUser && message.product && (
        <div className="mt-2">
          <ProductCardBubble product={message.product} />
        </div>
      )}
      {!isUser && message.products && message.products.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto max-w-full pb-1">
          {message.products.slice(1, 3).map((p, i) => (
            <ProductCardBubble key={i} product={p} />
          ))}
        </div>
      )}

      <span className="text-xs text-muted-foreground mt-1 px-2">
        {format(message.timestamp, 'h:mm a')}
      </span>
    </div>
  );
};
