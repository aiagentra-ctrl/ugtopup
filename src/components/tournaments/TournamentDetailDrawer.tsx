import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Copy, Crown, Eye, EyeOff, Flag, LogOut, Play, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { CountdownTimer } from "./CountdownTimer";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { formatCoins, initials, maskPassword, nameToColor } from "@/lib/tournamentsUtils";
import {
  fetchTournamentParticipants, fetchTournamentCredentials, finishTournament, leaveTournament, reportMatch, startTournament,
  type DBTournament,
} from "@/lib/tournamentsApi";
import { useAuth } from "@/contexts/AuthContext";

export const TournamentDetailDrawer = ({
  tournament,
  open,
  onOpenChange,
  onChanged,
}: {
  tournament: DBTournament | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<string>("");

  useEffect(() => {
    if (!open || !tournament) return;
    setLoading(true);
    fetchTournamentParticipants(tournament.id)
      .then((rows) => setParticipants(rows))
      .catch(() => setParticipants([]))
      .finally(() => setLoading(false));
  }, [open, tournament?.id]);

  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setRevealed(false), 5000);
    return () => clearTimeout(t);
  }, [revealed]);

  if (!tournament) return null;
  const isJoined = !!user && participants.some((p) => p.user_id === user.id);
  const isCreator = !!user && tournament.created_by === user.id;
  const canSeeCreds = isJoined || isCreator;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const handleLeave = async () => {
    if (!tournament) return;
    setBusy(true);
    try {
      await leaveTournament(tournament.id);
      toast.success("Left tournament — entry fee refunded");
      onChanged();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to leave");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      await startTournament(tournament.id);
      toast.success("Tournament started");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Failed to start");
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!winner) {
      toast.error("Select a winner first");
      return;
    }
    setBusy(true);
    try {
      await finishTournament(tournament.id, winner);
      toast.success("Tournament finished — prize sent to winner");
      onChanged();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to finish");
    } finally {
      setBusy(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setBusy(true);
    try {
      await reportMatch({
        tournament_id: tournament.id,
        match_name: tournament.name,
        reason: reportReason.trim(),
      });
      toast.success("Report submitted to admin");
      setReportReason("");
      setReporting(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
              style={{ background: nameToColor(tournament.game) }}
            >
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">{tournament.name}</SheetTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                <span>{tournament.game}</span>
                <span className="opacity-40">·</span>
                <span>{tournament.game_mode}</span>
                <RoomStatusBadge
                  status={tournament.room_status}
                  count={tournament.current_players}
                  max={tournament.max_players}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Crown className="h-3 w-3" /> Prize
              </div>
              <div className="mt-0.5 text-xl font-bold text-primary">{formatCoins(Number(tournament.prize))}</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Entry fee</div>
              <div className="mt-0.5 text-xl font-bold text-foreground">
                {formatCoins(Number(tournament.entry_fee))}
              </div>
            </div>
          </div>

          {tournament.starts_at && tournament.status === "upcoming" && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <CountdownTimer target={tournament.starts_at} className="text-sm" />
              <div className="mt-1 text-[11px] text-muted-foreground">
                {new Date(tournament.starts_at).toLocaleString()}
              </div>
            </div>
          )}

          {tournament.description && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[13px] text-muted-foreground">
              {tournament.description}
            </div>
          )}

          {/* Room creds */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Room credentials
            </div>
            {canSeeCreds ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-muted-foreground">Room ID</span>
                  <div className="flex items-center gap-1">
                    <code className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[12px]">
                      {tournament.room_id}
                    </code>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copy(tournament.room_id, "Room ID")}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-muted-foreground">Password</span>
                  <div className="flex items-center gap-1">
                    <code className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[12px]">
                      {revealed ? tournament.password : maskPassword(tournament.password)}
                    </code>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRevealed((r) => !r)}>
                      {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copy(tournament.password, "Password")}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-muted-foreground">
                Join the tournament to see Room ID & password.
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Users className="h-3 w-3" /> Participants
              </div>
              <span className="text-[11px] text-muted-foreground">
                {tournament.current_players}/{tournament.max_players}
              </span>
            </div>
            {loading ? (
              <div className="text-[12px] text-muted-foreground">Loading…</div>
            ) : participants.length ? (
              <div className="space-y-1.5">
                {participants.map((p) => {
                  const name = p.username || p.email?.split("@")[0] || "Player";
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-[12px]">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
                        style={{ background: nameToColor(name) }}
                      >
                        {initials(name)}
                      </span>
                      <span className="flex-1 truncate text-foreground">
                        {name}
                        {user?.id === p.user_id && <span className="ml-1 text-primary">(You)</span>}
                      </span>
                      {p.result === "won" && <span className="text-[10px] font-medium text-emerald-400">Won</span>}
                      {p.result === "lost" && <span className="text-[10px] text-muted-foreground">Lost</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[12px] text-muted-foreground">No players yet.</div>
            )}
          </div>

          {/* Creator controls */}
          {isCreator && tournament.status !== "finished" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-primary">
                Creator controls
              </div>
              {tournament.status === "upcoming" && (
                <Button size="sm" className="mb-2 w-full" onClick={handleStart} disabled={busy}>
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Start tournament
                </Button>
              )}
              {participants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[11px]">Declare winner</Label>
                  <select
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[12px]"
                  >
                    <option value="">Select winner…</option>
                    {participants.map((p) => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.username || p.email?.split("@")[0] || "Player"}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="secondary" className="w-full" onClick={handleFinish} disabled={busy || !winner}>
                    <Trophy className="mr-1.5 h-3.5 w-3.5" /> Finish & pay prize
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Player actions */}
          {isJoined && tournament.status === "upcoming" && (
            <Button variant="outline" size="sm" className="w-full" onClick={handleLeave} disabled={busy}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Leave & refund
            </Button>
          )}

          {isJoined && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              {reporting ? (
                <div className="space-y-2">
                  <Label className="text-[12px]">Report an issue</Label>
                  <Textarea
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the issue (cheating, no-show, dispute…)"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setReporting(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleReport} disabled={busy || !reportReason.trim()}>
                      Submit
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="w-full" onClick={() => setReporting(true)}>
                  <Flag className="mr-1.5 h-3.5 w-3.5" /> Report this match
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
