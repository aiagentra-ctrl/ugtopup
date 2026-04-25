import { useState } from "react";
import { Wallet, Crown, Trophy, X, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { WalletTab } from "@/components/tournaments/WalletTab";
import { WithdrawalsPanel } from "@/components/tournaments/WithdrawalsPanel";
import { WithdrawModal } from "@/components/tournaments/WithdrawModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import { useEffect } from "react";
import { fetchEarningsSummary, type EarningsSummary } from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";

const TournamentWalletPage = () => {
  const { user } = useAuth();
  const { balance } = useLiveBalance();
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
      subtitle="Manage your IG Coins and cash out winnings to NPR."
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          Withdraw winnings
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card icon={Wallet} label="Available" value={formatCoins(balance)} sub="IG Coins" tint="primary" />
        <Card icon={Crown} label="Total earned" value={formatCoins(summary?.totalEarnings ?? 0)} sub="all time" tint="amber" />
        <Card icon={Trophy} label="Wins" value={String(summary?.wins ?? 0)} sub="matches won" tint="emerald" />
        <Card icon={X} label="Losses" value={String(summary?.losses ?? 0)} sub="matches lost" tint="destructive" />
      </div>

      <div className="mb-4">
        <WalletTab balance={balance} onWithdraw={() => setOpen(true)} />
      </div>

      <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-foreground">
        <Activity className="h-4 w-4 text-primary" /> Withdrawal history
      </div>
      <WithdrawalsPanel refreshKey={refreshKey} onWithdrawClick={() => setOpen(true)} />

      <WithdrawModal
        open={open}
        onOpenChange={setOpen}
        balance={balance}
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
