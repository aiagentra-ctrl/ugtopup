import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/tournamentsApi";

const config: Record<RoomStatus, { label: string; dot: string; bg: string; text: string; pulse?: boolean }> = {
  waiting: { label: "Waiting", dot: "bg-amber-400", bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", pulse: true },
  full: { label: "Full", dot: "bg-destructive", bg: "bg-destructive/10 border-destructive/30", text: "text-destructive" },
  ongoing: { label: "Live", dot: "bg-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", pulse: true },
  finished: { label: "Finished", dot: "bg-muted-foreground", bg: "bg-muted/40 border-border", text: "text-muted-foreground" },
};

export const RoomStatusBadge = ({ status, count, max }: { status: RoomStatus; count?: number; max?: number }) => {
  const c = config[status] ?? config.waiting;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", c.bg, c.text)}>
      <span className="relative flex h-1.5 w-1.5">
        {c.pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", c.dot)} />}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", c.dot)} />
      </span>
      {c.label}
      {typeof count === "number" && typeof max === "number" && (
        <span className="ml-0.5 opacity-70">{count}/{max}</span>
      )}
    </span>
  );
};
