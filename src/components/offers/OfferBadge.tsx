import { cn } from "@/lib/utils";

interface OfferBadgeProps {
  text: string;
  color?: string;
  textColor?: string;
  animation?: string;
  className?: string;
}

const animationClasses: Record<string, string> = {
  none: "",
  pulse: "animate-pulse",
  flash: "animate-flash",
  bounce: "animate-bounce-subtle",
  "slide-in": "animate-slide-in-left",
};

export function OfferBadge({ text, color = "#ef4444", textColor = "#ffffff", animation = "none", className }: OfferBadgeProps) {
  return (
    <span
      className={cn(
        "absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold shadow-lg",
        animationClasses[animation] || "",
        className
      )}
      style={{ backgroundColor: color, color: textColor }}
    >
      {text}
    </span>
  );
}
