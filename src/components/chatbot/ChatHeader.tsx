import { ChevronDown, X, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onMinimize: () => void;
  onClose: () => void;
}

export const ChatHeader = ({ onMinimize, onClose }: ChatHeaderProps) => {
  return (
    <div 
      className="p-4 flex items-center gap-3 border-b flex-shrink-0"
      style={{
        background: "#1e3a5f",
        borderBottomColor: "#2d5a8f"
      }}
    >
      <img
        src="/logo.jpg"
        alt="UGC-Topup"
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70">Chat with</p>
        <h3 className="text-white font-semibold text-base leading-tight">
          UGC-Topup Support
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ background: "#10b981" }}
          />
          <span className="text-xs text-white/80">We're online</span>
        </div>
      </div>
      <button
        onClick={onMinimize}
        className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
        aria-label="Minimize chat"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
        aria-label="Close chat"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
