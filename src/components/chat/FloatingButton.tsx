import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import uiqLogo from '@/assets/uiq-logo.jpg';

interface FloatingButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const FloatingButton = ({ onClick, unreadCount = 0 }: FloatingButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-2xl hover:shadow-primary/80 transition-all hover:scale-110 animate-pulse-glow"
      aria-label="Open chat with UIQ AI assistant"
    >
      <div className="relative h-8 w-8 md:h-9 md:w-9 rounded-full overflow-hidden">
        <img 
          src={uiqLogo} 
          alt="UIQ" 
          className="h-full w-full object-cover"
        />
      </div>
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-background animate-bounce">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
};
