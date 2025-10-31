import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ value, onChange, onSend, disabled }: ChatInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className={`flex items-end gap-2 transition-all ${isFocused ? 'ring-2 ring-primary/30' : ''} rounded-xl`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 resize-none bg-input border-0 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 rounded-xl max-h-[100px] overflow-y-auto"
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
        <Button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/50 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
