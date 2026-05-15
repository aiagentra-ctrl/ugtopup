import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../ui/GlassCard";
import { ShimmerList } from "../ui/Shimmer";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Bookmark, RefreshCw, Trash2 } from "lucide-react";
import { LiveResultPanel } from "./LiveResultPanel";
import { toast } from "sonner";

export function SavedReportsTab({ onRerun }: { onRerun: (q: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_saved_reports" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(((data as any) ?? []) as any[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id: string) {
    if (!confirm("Delete this saved report?")) return;
    const { error } = await supabase.from("ai_saved_reports" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  }

  if (loading) return <ShimmerList rows={4} rowHeight={80} />;
  if (items.length === 0) return <EmptyState title="No saved reports yet" description="Pin AI responses to keep them here." icon={Bookmark} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {items.map((r) => (
        <GlassCard key={r.id} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => onRerun(r.query || r.title)} className="gap-1"><RefreshCw className="h-3.5 w-3.5" />Re-run</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? "Hide" : "View"}</Button>
              <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {openId === r.id && r.response_payload && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <LiveResultPanel payload={r.response_payload as any} />
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
