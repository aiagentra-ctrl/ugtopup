import { Bell } from "lucide-react";
import { mockNotifications } from "@/data/tournamentsMock";
import { relativeTime } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

const dotClass = (kind: string, read?: boolean) => {
  if (read) return "bg-muted-foreground/40";
  if (kind === "live") return "bg-destructive";
  if (kind === "win" || kind === "deposit") return "bg-emerald-500";
  return "bg-primary";
};

export const NotificationsPanel = () => (
  <div className="rounded-lg border border-border/60 bg-card p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
        <Bell className="h-4 w-4 text-primary" />
        Notifications
      </h3>
      <button className="text-[12px] text-primary hover:underline">Mark all read</button>
    </div>
    <div className="space-y-1">
      {mockNotifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "flex items-start gap-2.5 rounded-md px-2 py-2",
            !n.read && "bg-primary/5",
          )}
        >
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass(n.kind, n.read))} />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-foreground">{n.text}</div>
            <div className="text-[10px] text-muted-foreground">{relativeTime(n.at)}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
