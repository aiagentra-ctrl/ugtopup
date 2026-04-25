import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { generatePassword, generateRoomId } from "@/lib/tournamentsUtils";
import type { TournamentMatch } from "@/data/tournamentsMock";
import { cn } from "@/lib/utils";

const Toggle = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
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
  const [mode, setMode] = useState<"custom" | "lonewolf">("lonewolf");
  const [team, setTeam] = useState<"1v1" | "2v2" | "4v4">("1v1");
  const [throwable, setThrowable] = useState(true);
  const [gunAttr, setGunAttr] = useState(true);
  const [charSkill, setCharSkill] = useState(true);
  const [rounds, setRounds] = useState<9 | 13>(9);
  const [headshot, setHeadshot] = useState(true);
  const [coin, setCoin] = useState<"default" | "9980">("default");
  const [name, setName] = useState("");
  const [entry, setEntry] = useState("20");
  const [date, setDate] = useState("");
  const [agree, setAgree] = useState(false);
  const [rules, setRules] = useState("");
  const [success, setSuccess] = useState<TournamentMatch | null>(null);

  const entryNum = Number(entry) || 0;
  const winnings = entryNum * 2;
  const valid = name.trim().length > 2 && entryNum >= 20 && date && agree;

  const submit = () => {
    if (!valid) return;
    const m: TournamentMatch = {
      id: "new-" + Date.now(),
      name: name.trim(),
      game: mode === "lonewolf" ? "Lonewolf" : "Custom",
      roomId: generateRoomId(),
      password: generatePassword(),
      prize: winnings,
      entryFee: entryNum,
      status: "upcoming",
      startsAt: new Date(date).toISOString(),
    };
    setSuccess(m);
    onCreated(m);
  };

  const close = (v: boolean) => {
    if (!v) {
      setSuccess(null);
      setName("");
      setEntry("20");
      setDate("");
      setAgree(false);
      setRules("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create matchroom</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div className="text-[14px] font-medium">Matchroom created</div>
            <div className="text-[12px] text-muted-foreground">Room ID: <span className="font-mono text-foreground">{success.roomId}</span></div>
            <div className="text-[12px] text-muted-foreground">Password: <span className="font-mono text-foreground">{success.password}</span></div>
            <Button className="mt-2" onClick={() => close(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 text-[13px]">
            <div>
              <Label className="mb-1.5 block">Choose game mode</Label>
              <div className="flex gap-2">
                <Toggle active={mode === "custom"} onClick={() => setMode("custom")}>Custom Game Mode</Toggle>
                <Toggle active={mode === "lonewolf"} onClick={() => setMode("lonewolf")}>Lonewolf Game Mode</Toggle>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Team</Label>
              <div className="flex gap-2">
                {(["1v1", "2v2", "4v4"] as const).map((t) => (
                  <Toggle key={t} active={team === t} onClick={() => setTeam(t)}>{t}</Toggle>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Game settings</Label>
              {[
                { label: "Throwable Limit", v: throwable, set: setThrowable },
                { label: "Gun Attribute", v: gunAttr, set: setGunAttr },
                { label: "Character Skill", v: charSkill, set: setCharSkill },
                { label: "Headshot Only", v: headshot, set: setHeadshot },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">{row.label}</span>
                  <div className="flex gap-1.5">
                    <Toggle active={row.v} onClick={() => row.set(true)}>Yes</Toggle>
                    <Toggle active={!row.v} onClick={() => row.set(false)}>No</Toggle>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Rounds</span>
                <div className="flex gap-1.5">
                  <Toggle active={rounds === 9} onClick={() => setRounds(9)}>9 Rounds</Toggle>
                  <Toggle active={rounds === 13} onClick={() => setRounds(13)}>13 Rounds</Toggle>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Coin</span>
                <div className="flex gap-1.5">
                  <Toggle active={coin === "default"} onClick={() => setCoin("default")}>Default IG Coins</Toggle>
                  <Toggle active={coin === "9980"} onClick={() => setCoin("9980")}>9980 IG Coins</Toggle>
                </div>
              </div>
            </div>

            <div>
              <Label>Matchroom name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your matchroom name" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Entry fee</Label>
                <Input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} min={20} />
              </div>
              <div>
                <Label>Potential winning</Label>
                <Input value={winnings} readOnly className="bg-muted/40" />
              </div>
            </div>

            <div>
              <Label>Match rules & regulations</Label>
              <Textarea rows={3} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Optional notes" />
            </div>

            <div>
              <Label>Date & time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
              <span>I understand the match rules and regulations</span>
            </label>

            <Button onClick={submit} disabled={!valid} className="w-full">Create matchroom</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
