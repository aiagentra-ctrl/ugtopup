import { X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import uiqLogo from '@/assets/uiq-logo.jpg';

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader = ({ onClose }: ChatHeaderProps) => {
  return (
    <div className="relative flex items-center gap-3 p-4 bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-t-2xl shadow-lg shadow-primary/50">
      {/* UIQ Logo */}
      <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-foreground/20 shrink-0">
        <img 
          src={uiqLogo} 
          alt="UIQ Logo" 
          className="h-full w-full object-cover"
        />
      </div>
      
      {/* Title and Status */}
      <div className="flex-1">
        <h3 className="font-semibold text-base">Chat with UIQ</h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs opacity-90">AI is online</span>
        </div>
      </div>

      {/* Close Button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-primary-foreground/20 text-primary-foreground"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
