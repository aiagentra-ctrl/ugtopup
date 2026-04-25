import { useEffect, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { relativeTime } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

interface NotifRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  notification_type: string;
}

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_notifications")
      .select("id, is_read, notifications(id, title, message, created_at, notification_type)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    const mapped: NotifRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      is_read: !!r.is_read,
      title: r.notifications?.title ?? "",
      message: r.notifications?.message ?? "",
      created_at: r.notifications?.created_at ?? new Date().toISOString(),
      notification_type: r.notifications?.notification_type ?? "general",
    }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const dotClass = (type: string, read: boolean) => {
    if (read) return "bg-muted-foreground/40";
    if (type === "order") return "bg-emerald-500";
    if (type === "payment") return "bg-primary";
    return "bg-primary";
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
        </h3>
        <button onClick={load} className="text-muted-foreground hover:text-foreground" aria-label="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      {loading ? (
        <div className="text-[12px] text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center text-[12px] text-muted-foreground">No notifications yet</div>
      ) : (
        <div className="space-y-1">
          {items.map((n) => (
            <div
              key={n.id}
              className={cn("flex items-start gap-2.5 rounded-md px-2 py-2", !n.is_read && "bg-primary/5")}
            >
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass(n.notification_type, n.is_read))} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-foreground">{n.title}</div>
                <div className="text-[11px] text-muted-foreground">{n.message}</div>
                <div className="text-[10px] text-muted-foreground">{relativeTime(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
