import { ArrowDownToLine, ArrowUpFromLine, Trophy, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { mockTransactions, type ArenaTransaction } from "@/data/tournamentsMock";

const icon = (t: ArenaTransaction["type"]) => {
  if (t === "deposit") return <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" />;
  if (t === "withdraw") return <ArrowUpFromLine className="h-3.5 w-3.5 text-destructive" />;
  return <Trophy className="h-3.5 w-3.5 text-amber-400" />;
};

export const WalletTab = ({ balance, onWithdraw }: { balance: number; onWithdraw: () => void }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/40 p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Current balance</div>
        <div className="mt-1 flex items-center gap-2">
          <Coins className="h-6 w-6 text-emerald-400" />
          <span className="text-3xl font-medium text-emerald-400">{formatCoins(balance)}</span>
          <span className="text-[12px] text-muted-foreground">IG Coins</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline">eSewa</Button>
          <Button size="sm" variant="outline">Khalti</Button>
          <Button size="sm" variant="outline">Bank Transfer</Button>
          <Button size="sm" variant="ghost" onClick={onWithdraw}>Withdraw</Button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Transaction history</div>
        <div className="overflow-hidden rounded-lg border border-border/60">
          {mockTransactions.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-3 py-2.5 ${i < mockTransactions.length - 1 ? "border-b border-border/60" : ""}`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{icon(t.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-foreground capitalize">{t.type} · {t.source}</div>
                <div className="text-[11px] text-muted-foreground">{relativeTime(t.at)}</div>
              </div>
              <div className={`text-[13px] font-medium ${t.type === "withdraw" ? "text-destructive" : "text-emerald-400"}`}>
                {t.type === "withdraw" ? "-" : "+"}{formatCoins(t.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
