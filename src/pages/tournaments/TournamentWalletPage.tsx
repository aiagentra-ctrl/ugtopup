import { useState, useEffect } from "react";
import { Wallet, Crown, Trophy, X, Activity, Lock, Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { WalletTab } from "@/components/tournaments/WalletTab";
import { WithdrawalsPanel } from "@/components/tournaments/WithdrawalsPanel";
import { WithdrawModal } from "@/components/tournaments/WithdrawModal";
import { StatChip } from "@/components/tournaments/StatChip";
import { SectionHeader } from "@/components/tournaments/SectionHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import { useWinningsBalance } from "@/hooks/useWinningsBalance";
import { useHeldBalance } from "@/hooks/useHeldBalance";
import { fetchEarningsSummary, type EarningsSummary } from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";

const TournamentWalletPage = () => {
  const { user } = useAuth();
  const { balance } = useLiveBalance();
  const { winnings } = useWinningsBalance();
  const { held } = useHeldBalance();
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
        <Button size="sm" onClick={() => setOpen(true)} disabled={winnings <= 0} className="btn-glow gap-1.5 font-semibold">
          <ArrowUpRight className="h-4 w-4" /> Withdraw winnings
        </Button>
      }
    >
      {/* Hero balance */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="sheen relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-card to-card p-6 sm:col-span-2 animate-glow-pulse">
          <span className="orb orb-primary right-[-30px] top-[-20px] h-32 w-32 opacity-20 animate-float" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3 w-3" /> Withdrawable winnings
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-stat text-5xl font-bold text-emerald-400 sm:text-6xl">{formatCoins(winnings)}</span>
              <span className="text-sm font-semibold text-muted-foreground">IG Coins</span>
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">Tournament prizes only · cash out to NPR</div>
            <Button size="sm" className="btn-glow mt-4 gap-1.5" onClick={() => setOpen(true)} disabled={winnings <= 0}>
              <ArrowUpRight className="h-4 w-4" /> Withdraw to NPR
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Lock className="h-3 w-3" /> Locked credits
          </div>
          <div className="mt-3 font-stat text-4xl font-bold text-foreground">{formatCoins(balance)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Used for entry fees & store purchases — not withdrawable.</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip icon={Wallet} label="Available" value={winnings}                 tint="emerald" suffix="IG" />
        <StatChip icon={Crown}  label="Total earned" value={summary?.totalEarnings ?? 0} tint="amber"   suffix="IG" />
        <StatChip icon={Trophy} label="Wins"      value={summary?.wins ?? 0}        tint="primary" />
        <StatChip icon={X}      label="Losses"    value={summary?.losses ?? 0}      tint="rose" />
      </div>

      <div className="mb-6">
        <WalletTab balance={winnings} onWithdraw={() => setOpen(true)} />
      </div>

      <SectionHeader eyebrow="Activity" icon={Activity} title="Withdrawal history" />
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

export default TournamentWalletPage;
