import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { generatePassword, generateRoomId, formatCoins } from "@/lib/tournamentsUtils";
import type { TournamentMatch } from "@/data/tournamentsMock";
import { cn } from "@/lib/utils";
import { createTournament } from "@/lib/tournamentsApi";
import { toast } from "sonner";

const Toggle = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

export const CreateTournamentModal = ({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (m: TournamentMatch) => void;
}) => {
  const [game, setGame] = useState<"Free Fire" | "PUBG" | "Mobile Legends" | "Custom">("Free Fire");
  const [mode, setMode] = useState<"1v1" | "2v2" | "4v4" | "Squad">("1v1");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entry, setEntry] = useState("20");
  const [date, setDate] = useState("");
  const [agree, setAgree] = useState(false);
  const [success, setSuccess] = useState<{ roomId: string; password: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const entryNum = Number(entry) || 0;
  // Prize pool = entry × max players × 0.9 (10% platform cut)
  const prize = Math.floor(entryNum * maxPlayers * 0.9);
  const valid = name.trim().length > 2 && entryNum >= 20 && date && agree && !submitting;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    const roomId = generateRoomId();
    const password = generatePassword();
    try {
      await createTournament({
        name: name.trim(),
        game,
        game_mode: mode,
        description: description.trim() || null,
        room_id: roomId,
        password,
        prize,
        entry_fee: entryNum,
        max_players: maxPlayers,
        starts_at: new Date(date).toISOString(),
      });
      setSuccess({ roomId, password });
      onCreated({
        id: roomId, name: name.trim(), game, roomId, password, prize, entryFee: entryNum,
        status: "upcoming", startsAt: new Date(date).toISOString(),
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  const close = (v: boolean) => {
    if (!v) {
      setSuccess(null);
      setName("");
      setDescription("");
      setEntry("20");
      setDate("");
      setAgree(false);
    }
    onOpenChange(v);
  };

  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create matchroom</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <div className="text-[15px] font-semibold">Matchroom created!</div>
            <div className="w-full space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Room ID</span>
                <div className="flex items-center gap-1">
                  <code className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[12px]">{success.roomId}</code>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copy(success.roomId, "Room ID")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Password</span>
                <div className="flex items-center gap-1">
                  <code className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[12px]">{success.password}</code>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copy(success.password, "Password")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={() => close(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 text-[13px]">
            <div>
              <Label className="mb-1.5 block">Game</Label>
              <div className="flex flex-wrap gap-2">
                {(["Free Fire", "PUBG", "Mobile Legends", "Custom"] as const).map((g) => (
                  <Toggle key={g} active={game === g} onClick={() => setGame(g)}>{g}</Toggle>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Mode</Label>
              <div className="flex flex-wrap gap-2">
                {(["1v1", "2v2", "4v4", "Squad"] as const).map((t) => (
                  <Toggle
                    key={t}
                    active={mode === t}
                    onClick={() => {
                      setMode(t);
                      setMaxPlayers(t === "1v1" ? 2 : t === "2v2" ? 4 : t === "4v4" ? 8 : 16);
                    }}
                  >
                    {t}
                  </Toggle>
                ))}
              </div>
            </div>

            <div>
              <Label>Matchroom name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your matchroom name" />
            </div>

            <div>
              <Label>Description / rules (optional)</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Headshot only, no thirsting…" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Max players</Label>
                <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(Math.max(2, Number(e.target.value) || 2))} min={2} max={100} />
              </div>
              <div>
                <Label>Entry fee (coins)</Label>
                <Input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} min={20} />
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prize pool</span>
                <span className="text-lg font-semibold text-primary">{formatCoins(prize)} coins</span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {entryNum} × {maxPlayers} players × 90% (10% platform fee)
              </div>
            </div>

            <div>
              <Label>Date & time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
              <span>I understand the match rules and that disputes are reviewed by IG Arena admins.</span>
            </label>

            <Button onClick={submit} disabled={!valid} className="w-full">
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Create matchroom
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
