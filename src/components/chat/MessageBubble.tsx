import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/hooks/useChat';
import { ProductCardBubble } from './ProductCardBubble';
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitChatFeedback, getSessionId } from '@/utils/chatApi';

interface MessageBubbleProps {
  message: Message;
  previousUserMessage?: string;
}

export const MessageBubble = ({ message, previousUserMessage }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (rating: 'helpful' | 'not_helpful') => {
    if (feedbackGiven || submitting) return;
    setSubmitting(true);
    setFeedbackGiven(rating);

    await submitChatFeedback({
      message_id: message.id,
      session_id: getSessionId(),
      user_message: previousUserMessage || undefined,
      bot_response: message.text,
      rating,
    });

    setSubmitting(false);
  };

  const showFeedback = !isUser && message.id !== 'welcome' && !message.id.startsWith('error-');

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[70%] px-4 py-3 break-words ${
          isUser
            ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl rounded-br-md shadow-lg shadow-primary/30'
            : 'bg-card text-card-foreground border border-border rounded-2xl rounded-bl-md'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        ) : (
          <div className="text-sm prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-1 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded-md [&_hr]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-2 [&_blockquote]:my-1">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
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

      {/* Feedback + timestamp row */}
      <div className="flex items-center gap-2 mt-1 px-2">
        <span className="text-xs text-muted-foreground">
          {format(message.timestamp, 'h:mm a')}
        </span>

        {showFeedback && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleFeedback('helpful')}
              disabled={!!feedbackGiven}
              className={`p-0.5 rounded transition-colors ${
                feedbackGiven === 'helpful'
                  ? 'text-green-500'
                  : feedbackGiven
                    ? 'text-muted-foreground/30 cursor-default'
                    : 'text-muted-foreground/50 hover:text-green-500'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback('not_helpful')}
              disabled={!!feedbackGiven}
              className={`p-0.5 rounded transition-colors ${
                feedbackGiven === 'not_helpful'
                  ? 'text-red-500'
                  : feedbackGiven
                    ? 'text-muted-foreground/30 cursor-default'
                    : 'text-muted-foreground/50 hover:text-red-500'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
