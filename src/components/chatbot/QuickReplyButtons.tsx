import { cn } from "@/lib/utils";

interface QuickReplyButtonsProps {
  replies: string[];
  onReplyClick: (reply: string) => void;
  disabled?: boolean;
}

export const QuickReplyButtons = ({ 
  replies, 
  onReplyClick, 
  disabled = false 
}: QuickReplyButtonsProps) => {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 animate-slide-in">
      {replies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onReplyClick(reply)}
          disabled={disabled}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:scale-102 active:scale-98",
            index === 0 
              ? "text-white shadow-md hover:shadow-lg" 
              : "bg-white border text-[#374151] hover:shadow-md"
          )}
          style={
            index === 0 
              ? { background: "#1e3a5f" }
              : { borderColor: "#e5e7eb" }
          }
        >
          {reply}
        </button>
      ))}
    </div>
  );
};
