import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { fetchActiveAnnouncements, type Announcement } from "@/lib/announcementApi";

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActiveAnnouncements();
        // Filter to banner type only
        setAnnouncements(data.filter(a => a.type === 'banner'));
      } catch { /* silent */ }
    };
    load();
  }, []);

  // Load dismissed from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('dismissed_announcements');
    if (stored) setDismissed(new Set(JSON.parse(stored)));
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    sessionStorage.setItem('dismissed_announcements', JSON.stringify([...next]));
  };

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0">
      {visible.map(a => (
        <div key={a.id} className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center gap-3">
          <Megaphone className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground">{a.title}</span>
            {a.message && <span className="text-sm text-muted-foreground ml-2">{a.message}</span>}
          </div>
          <button onClick={() => dismiss(a.id)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
