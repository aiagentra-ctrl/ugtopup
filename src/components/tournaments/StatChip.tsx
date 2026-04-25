import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const tints = {
  primary:  "border-primary/30 bg-primary/10 text-primary",
  emerald:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  amber:    "border-amber-500/30 bg-amber-500/10 text-amber-400",
  rose:     "border-rose-500/30 bg-rose-500/10 text-rose-400",
  violet:   "border-violet-500/30 bg-violet-500/10 text-violet-400",
} as const;

type Tint = keyof typeof tints;

interface Props {
  icon: any;
  label: string;
  value: number | string;
  suffix?: string;
  tint?: Tint;
  pulse?: boolean;
  /** if numeric, animates a count-up */
  animate?: boolean;
}

export const StatChip = ({
  icon: Icon, label, value, suffix, tint = "primary", pulse, animate = true,
}: Props) => {
  const isNum = typeof value === "number";
  const [display, setDisplay] = useState<number | string>(isNum && animate ? 0 : value);
  const target = isNum ? (value as number) : 0;
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!isNum || !animate) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = typeof display === "number" ? display : 0;
    const dur = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, isNum, animate]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur transition-colors hover:border-primary/30">
      <div className={cn("mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md border", tints[tint], pulse && "animate-glow-pulse")}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="font-stat text-2xl font-bold leading-none text-foreground">
        {typeof display === "number" ? display.toLocaleString() : display}
        {suffix && <span className="ml-1 text-[12px] font-medium text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
};
