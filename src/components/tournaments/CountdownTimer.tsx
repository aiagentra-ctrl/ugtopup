import { Clock } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

export const CountdownTimer = ({
  target,
  className,
  iconClassName,
  prefix = "Starts in",
  livePrefix = "Live now",
}: {
  target?: string | null;
  className?: string;
  iconClassName?: string;
  prefix?: string;
  livePrefix?: string;
}) => {
  const c = useCountdown(target);
  if (!target) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-[12px]", className)}>
      <Clock className={cn("h-3.5 w-3.5", iconClassName)} />
      <span className="text-muted-foreground">{c.expired ? livePrefix : prefix}:</span>
      <span className={cn("font-medium", c.expired ? "text-emerald-400" : "text-foreground")}>{c.label}</span>
    </span>
  );
};
