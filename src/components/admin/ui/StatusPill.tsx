import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info" | "neutral" | "pending";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  neutral: "bg-muted text-muted-foreground border-border",
  pending: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

const STATUS_TONES: Record<string, Tone> = {
  completed: "success",
  confirmed: "success",
  approved: "success",
  active: "success",
  paid: "success",
  pending: "pending",
  processing: "info",
  failed: "error",
  rejected: "error",
  canceled: "error",
  cancelled: "error",
  inactive: "neutral",
};

export function StatusPill({ status, tone, className }: { status: string; tone?: Tone; className?: string }) {
  const resolved: Tone = tone ?? STATUS_TONES[status?.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium capitalize",
        toneClasses[resolved],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-current`)} />
      {status}
    </span>
  );
}
