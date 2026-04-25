import { useState, useEffect } from "react";
import { Wallet, Crown, Trophy, X, Activity, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { WalletTab } from "@/components/tournaments/WalletTab";
import { WithdrawalsPanel } from "@/components/tournaments/WithdrawalsPanel";
import { WithdrawModal } from "@/components/tournaments/WithdrawModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import { useWinningsBalance } from "@/hooks/useWinningsBalance";
import { fetchEarningsSummary, type EarningsSummary } from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";

const TournamentWalletPage = () => {
  const { user } = useAuth();
  const { balance } = useLiveBalance();
  const { winnings } = useWinningsBalance();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchEarningsSummary(user.id).then(setSummary).catch(() => {});
  }, [user?.id, refreshKey]);

  return (
    <TournamentsLayout
      title="Wallet & Withdrawals"
      subtitle="Withdraw your tournament winnings to NPR. Deposited credits are not withdrawable."
      actions={
        <Button size="sm" onClick={() => setOpen(true)} disabled={winnings <= 0}>
          Withdraw winnings
        </Button>
      }
    >
      {/* Balance breakdown */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-emerald-400">
            <Trophy className="h-3.5 w-3.5" /> Withdrawable winnings
          </div>
          <div className="mt-1 text-3xl font-bold text-emerald-400">{formatCoins(winnings)}</div>
          <div className="text-[11px] text-muted-foreground">Tournament prizes only · cash out to NPR</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Credit balance (not withdrawable)
          </div>
          <div className="mt-1 text-3xl font-bold text-foreground">{formatCoins(balance)}</div>
          <div className="text-[11px] text-muted-foreground">Used for entry fees & store purchases</div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card icon={Wallet} label="Available" value={formatCoins(winnings)} sub="winnings" tint="emerald" />
        <Card icon={Crown} label="Total earned" value={formatCoins(summary?.totalEarnings ?? 0)} sub="all time" tint="amber" />
        <Card icon={Trophy} label="Wins" value={String(summary?.wins ?? 0)} sub="matches won" tint="primary" />
        <Card icon={X} label="Losses" value={String(summary?.losses ?? 0)} sub="matches lost" tint="destructive" />
      </div>

      <div className="mb-4">
        <WalletTab balance={winnings} onWithdraw={() => setOpen(true)} />
      </div>

      <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-foreground">
        <Activity className="h-4 w-4 text-primary" /> Withdrawal history
      </div>
      <WithdrawalsPanel refreshKey={refreshKey} onWithdrawClick={() => setOpen(true)} />

      <WithdrawModal
        open={open}
        onOpenChange={setOpen}
        balance={winnings}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </TournamentsLayout>
  );
};

const tints = {
  primary: "border-primary/20 bg-primary/5 text-primary",
  emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  destructive: "border-destructive/20 bg-destructive/5 text-destructive",
} as const;

const Card = ({
  icon: Icon, label, value, sub, tint,
}: { icon: any; label: string; value: string; sub: string; tint: keyof typeof tints }) => (
  <div className={`rounded-lg border p-3 ${tints[tint]}`}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <div className="mt-0.5 text-xl font-semibold">{value}</div>
    <div className="text-[11px] text-muted-foreground">{sub}</div>
  </div>
);

export default TournamentWalletPage;
