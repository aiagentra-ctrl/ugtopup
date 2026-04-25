import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
  sheen?: boolean;
}

export const PremiumCard = forwardRef<HTMLDivElement, Props>(
  ({ children, glow, sheen = true, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "card-premium",
        sheen && "sheen",
        glow && "shadow-[0_0_28px_-4px_hsl(var(--primary)/0.35)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
);
PremiumCard.displayName = "PremiumCard";
