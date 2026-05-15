import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../ui/GlassCard";
import { Shimmer, ShimmerList } from "../ui/Shimmer";
import { EmptyState } from "../ui/EmptyState";
import { SearchBar } from "../ui/SearchBar";
import { StatusPill } from "../ui/StatusPill";
import { Button } from "@/components/ui/button";
import { History, Undo2 } from "lucide-react";
import { toast } from "sonner";

export function ChangelogTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_changelogs" as any)
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setItems(((data as any) ?? []) as any[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function rollback(id: string) {
    if (!confirm("Revert this change?")) return;
    const { error } = await supabase.rpc("rollback_ai_change", { p_change_id: id });
    if (error) toast.error(error.message);
    else { toast.success("Reverted"); load(); }
  }

  const filtered = items.filter((i) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      i.action_type?.toLowerCase().includes(s) ||
      i.table_name?.toLowerCase().includes(s) ||
      i.performed_by_email?.toLowerCase().includes(s) ||
      String(i.record_id ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <GlassCard className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Changelog</h3>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <SearchBar value={q} onChange={setQ} placeholder="Search action, table, admin…" />
      </div>
      {loading ? (
        <ShimmerList rows={6} rowHeight={64} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No changes yet" description="AI write actions will appear here." icon={History} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-white/5">
              <tr>
                <th className="text-left py-2 px-2">Action</th>
                <th className="text-left py-2 px-2">Table</th>
                <th className="text-left py-2 px-2 hidden md:table-cell">Record</th>
                <th className="text-left py-2 px-2 hidden md:table-cell">Who</th>
                <th className="text-left py-2 px-2">When</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-right py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-2 capitalize">{c.action_type}</td>
                  <td className="py-2 px-2 font-mono text-xs">{c.table_name}</td>
                  <td className="py-2 px-2 hidden md:table-cell font-mono text-xs truncate max-w-[140px]">{c.record_id}</td>
                  <td className="py-2 px-2 hidden md:table-cell text-xs truncate max-w-[160px]">{c.performed_by_email}</td>
                  <td className="py-2 px-2 text-xs">{new Date(c.performed_at).toLocaleString()}</td>
                  <td className="py-2 px-2">
                    {c.rolled_back ? <StatusPill status="rolled back" tone="warning" /> : <StatusPill status="active" tone="success" />}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Button size="sm" variant="ghost" disabled={c.rolled_back || !!c.rollback_of} onClick={() => rollback(c.id)} className="gap-1.5">
                      <Undo2 className="h-3.5 w-3.5" />Rollback
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
