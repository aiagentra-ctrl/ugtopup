import * as React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-white/[0.08] bg-card/60 backdrop-blur-md text-card-foreground",
        "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] transition-all duration-200",
        "hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] hover:border-white/[0.12]",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
