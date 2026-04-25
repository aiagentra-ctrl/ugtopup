import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsRow } from "@/components/tournaments/StatsRow";
import { MyGamesPanel } from "@/components/tournaments/MyGamesPanel";
import { Leaderboard } from "@/components/tournaments/Leaderboard";
import { NotificationsPanel } from "@/components/tournaments/NotificationsPanel";
import { ActiveTournamentsCard } from "@/components/tournaments/ActiveTournamentsCard";
import { HowItWorks } from "@/components/tournaments/HowItWorks";

const Tournaments = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-medium tracking-tight">
            <span className="text-primary">IG</span> Arena
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Compete in live tournaments, win IG Coins, and climb the leaderboard.
          </p>
        </div>

        <section className="mb-6">
          <StatsRow />
        </section>

        <section className="mb-6">
          <MyGamesPanel />
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <Leaderboard />
          <div className="space-y-4">
            <NotificationsPanel />
            <ActiveTournamentsCard />
          </div>
        </section>

        <section className="mb-2">
          <h2 className="mb-3 text-[16px] font-medium text-foreground">How it works</h2>
          <HowItWorks />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Tournaments;
