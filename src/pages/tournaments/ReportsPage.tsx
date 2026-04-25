import { useEffect, useState } from "react";
import { Flag, Inbox, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { StatusBadge } from "@/components/tournaments/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserReports, fetchJoinedMatches, reportMatch, type DBReport, type JoinedMatch } from "@/lib/tournamentsApi";
import { relativeTime } from "@/lib/tournamentsUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DBReport[]>([]);
  const [matches, setMatches] = useState<JoinedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
  const [matchName, setMatchName] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [r, j] = await Promise.all([fetchUserReports(user.id), fetchJoinedMatches(user.id)]);
      setReports(r);
      setMatches(j);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const submit = async () => {
    if (!tournamentId || !reason.trim() || !matchName.trim()) {
      toast.error("Select a match and describe the issue");
      return;
    }
    setSubmitting(true);
    try {
      await reportMatch({ tournament_id: tournamentId, match_name: matchName, reason: reason.trim() });
      toast.success("Report filed. Admins will review it.");
      setOpen(false);
      setTournamentId("");
      setMatchName("");
      setReason("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't file report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TournamentsLayout
      title="Reports & Disputes"
      subtitle="File or track disputes for matches you've played."
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> File report
        </Button>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState icon={Inbox} title="No reports filed" description="Anything you report will appear here." />
        ) : (
          reports.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 px-4 py-3 ${i < reports.length - 1 ? "border-b border-border/60" : ""}`}
            >
              <Flag className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-foreground">{r.match_name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{r.reason} · {relativeTime(r.created_at)}</div>
                {r.admin_response && (
                  <div className="mt-1 text-[11px] text-foreground"><span className="text-muted-foreground">Admin:</span> {r.admin_response}</div>
                )}
              </div>
              <StatusBadge
                status={r.status === "review" ? "upcoming" : r.status === "resolved" ? "won" : "lost"}
                label={r.status === "review" ? "Under review" : r.status === "resolved" ? "Resolved" : "Rejected"}
              />
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File a dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-[13px]">
            <div>
              <Label>Match</Label>
              <select
                value={tournamentId}
                onChange={(e) => {
                  setTournamentId(e.target.value);
                  const m = matches.find((mm) => mm.id === e.target.value);
                  setMatchName(m?.name ?? "");
                }}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px]"
              >
                <option value="">Select a match…</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.game})</option>
                ))}
              </select>
            </div>
            {matches.length === 0 && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] text-muted-foreground">
                You need to have joined a match before filing a report. Or describe it manually:
              </div>
            )}
            <div>
              <Label>Match name</Label>
              <Input value={matchName} onChange={(e) => setMatchName(e.target.value)} placeholder="Match name" />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the issue clearly…" />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              Submit report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TournamentsLayout>
  );
};

export default ReportsPage;
