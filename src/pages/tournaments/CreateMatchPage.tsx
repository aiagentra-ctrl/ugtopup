import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Loader2, CheckCircle2, Copy, ChevronLeft, ChevronRight, Gamepad2, Coins,
  CalendarClock, Sparkles, ShieldCheck, Trophy, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { createTournament } from "@/lib/tournamentsApi";
import { generatePassword, generateRoomId, formatCoins } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

type Game = "Free Fire" | "PUBG" | "Mobile Legends" | "Custom";
type Mode = "1v1" | "2v2" | "4v4" | "Squad";

const GAMES: { v: Game; emoji: string; desc: string }[] = [
  { v: "Free Fire", emoji: "🔥", desc: "Battle royale" },
  { v: "PUBG", emoji: "🎯", desc: "Tactical shooter" },
  { v: "Mobile Legends", emoji: "⚔️", desc: "MOBA 5v5" },
  { v: "Custom", emoji: "🎮", desc: "Any other game" },
];

const STEPS = ["Game & Mode", "Match details", "Schedule"] as const;

const CreateMatchPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [game, setGame] = useState<Game>("Free Fire");
  const [mode, setMode] = useState<Mode>("1v1");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entry, setEntry] = useState("20");
  const [date, setDate] = useState("");
  const [agree, setAgree] = useState(false);
  const [success, setSuccess] = useState<{ roomId: string; password: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<{ default_commission_percent: number; host_fee_flat: number; host_fee_percent: number; min_entry_fee: number; max_entry_fee: number } | null>(null);

  // Load live platform settings for accurate preview
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useState(() => {
    import("@/lib/tournamentAdminApi").then(({ fetchTournamentSettings }) =>
      fetchTournamentSettings().then((s) => s && setSettings(s as any)).catch(() => {})
    );
    return null;
  });

  const entryNum = Number(entry) || 0;
  const commissionPct = settings?.default_commission_percent ?? 10;
  const hostFee = settings ? settings.host_fee_flat + Math.round((entryNum * settings.host_fee_percent) / 100) : 50;
  const grossPool = entryNum * maxPlayers + hostFee;
  const commissionAmt = Math.round((grossPool * commissionPct) / 100);
  const winnerPrize = grossPool - commissionAmt;

  const canNext0 = !!game && !!mode;
  const minEntry = settings?.min_entry_fee ?? 10;
  const maxEntry = settings?.max_entry_fee ?? 10000;
  const canNext1 = name.trim().length > 2 && entryNum >= minEntry && entryNum <= maxEntry && maxPlayers >= 2;
  const canSubmit = canNext0 && canNext1 && date && agree && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
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
        prize: winnerPrize,
        entry_fee: entryNum,
        max_players: maxPlayers,
        starts_at: new Date(date).toISOString(),
      });
      setSuccess({ roomId, password });
      toast.success(`Matchroom created! ${hostFee} coins held as host fee.`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));

  if (success) {
    return (
      <TournamentsLayout title="Matchroom Live" subtitle="Share these credentials with your players.">
        <div className="mx-auto max-w-md">
          <div className="card-premium relative overflow-hidden p-7 text-center">
            <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/20">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-scale-in" />
            </div>
            <div className="font-display mt-4 text-xl font-bold text-foreground">Your room is live</div>
            <p className="mt-1 text-[12px] text-muted-foreground">Players can now join and pay the entry fee.</p>
            <div className="mt-5 space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Room ID</span>
                <div className="flex items-center gap-1">
                  <code className="font-stat rounded border border-border bg-background px-2 py-0.5 text-[13px] font-bold tracking-wider">{success.roomId}</code>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copy(success.roomId, "Room ID")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Password</span>
                <div className="flex items-center gap-1">
                  <code className="font-stat rounded border border-border bg-background px-2 py-0.5 text-[13px] font-bold tracking-wider">{success.password}</code>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copy(success.password, "Password")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/tournaments/my-games")}>View My Games</Button>
              <Button className="btn-glow flex-1" onClick={() => navigate("/tournaments/join")}>Browse Rooms</Button>
            </div>
          </div>
        </div>
      </TournamentsLayout>
    );
  }

  return (
    <TournamentsLayout title="Create Match Room" subtitle="Set up a tournament — players join with IG Coins, winner takes the pool.">
      <div className="mx-auto max-w-2xl">
        {/* Stepper */}
        <div className="mb-6 flex items-center justify-between gap-2">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold transition-all",
                  done && "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                  active && "border-primary bg-primary/15 text-primary shadow-[0_0_14px_-4px_hsl(var(--primary)/0.7)]",
                  !active && !done && "border-border bg-muted/30 text-muted-foreground"
                )}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <div className={cn("text-[11px] font-semibold uppercase tracking-wider", active ? "text-primary" : done ? "text-emerald-400" : "text-muted-foreground")}>
                  {label}
                </div>
                {i < STEPS.length - 1 && <div className={cn("h-px flex-1", done ? "bg-emerald-500/40" : "bg-border")} />}
              </div>
            );
          })}
        </div>

        <div className="card-premium p-5 sm:p-6">
          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="font-display mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Gamepad2 className="h-4 w-4 text-primary" /> Pick a game</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GAMES.map((g) => (
                    <button
                      key={g.v}
                      type="button"
                      onClick={() => setGame(g.v)}
                      className={cn(
                        "sheen flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all",
                        game === g.v
                          ? "border-primary bg-primary/10 shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]"
                          : "border-border/60 bg-muted/20 hover:border-primary/40"
                      )}
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <div className="min-w-0">
                        <div className={cn("text-[13px] font-bold", game === g.v ? "text-primary" : "text-foreground")}>{g.v}</div>
                        <div className="text-[11px] text-muted-foreground">{g.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-display mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><Users className="h-4 w-4 text-primary" /> Match mode</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["1v1","2v2","4v4","Squad"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setMaxPlayers(m === "1v1" ? 2 : m === "2v2" ? 4 : m === "4v4" ? 8 : 16);
                      }}
                      className={cn(
                        "rounded-lg border py-3 text-center font-stat text-base font-bold transition-all",
                        mode === m
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_14px_-4px_hsl(var(--primary)/0.6)]"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <Label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Matchroom name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Friday Night Showdown" className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Rules / description (optional)</Label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Headshot only, no thirsting, max 1 revive…" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Max players</Label>
                  <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(Math.max(2, Number(e.target.value) || 2))} min={2} max={100} className="mt-1.5 font-stat font-bold" />
                </div>
                <div>
                  <Label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Entry fee (coins)</Label>
                  <Input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} min={20} className="mt-1.5 font-stat font-bold" />
                </div>
              </div>

              {/* Live prize preview */}
              <div className="card-premium p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Trophy className="h-3 w-3" /> Prize pool preview
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{entryNum} × {maxPlayers} players × 90% (10% fee)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-stat text-3xl font-bold text-amber-400">{formatCoins(prize)}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">IG Coins</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <Label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Date & time</Label>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 font-stat" />
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="font-display mb-3 text-[12px] font-bold uppercase tracking-wider text-foreground"><Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-primary" /> Match summary</div>
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <dt className="text-muted-foreground">Game</dt><dd className="text-right font-semibold text-foreground">{game}</dd>
                  <dt className="text-muted-foreground">Mode</dt><dd className="text-right font-semibold text-foreground">{mode}</dd>
                  <dt className="text-muted-foreground">Name</dt><dd className="text-right font-semibold text-foreground">{name || "—"}</dd>
                  <dt className="text-muted-foreground">Players</dt><dd className="text-right font-stat font-bold text-foreground">{maxPlayers}</dd>
                  <dt className="text-muted-foreground">Entry fee</dt><dd className="text-right font-stat font-bold text-foreground">{formatCoins(entryNum)} IG</dd>
                  <dt className="text-muted-foreground">Prize pool</dt><dd className="text-right font-stat font-bold text-amber-400">{formatCoins(prize)} IG</dd>
                </dl>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-[12px] text-muted-foreground">
                <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
                <span><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" /> I understand the match rules and that disputes are reviewed by IG Arena admins.</span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 0 && !canNext0) || (step === 1 && !canNext1)}
                className="btn-glow gap-1 font-semibold"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={!canSubmit} className="btn-glow gap-2 font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create matchroom
              </Button>
            )}
          </div>
        </div>
      </div>
    </TournamentsLayout>
  );
};

export default CreateMatchPage;
