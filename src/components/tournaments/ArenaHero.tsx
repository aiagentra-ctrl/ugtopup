import { Link } from "react-router-dom";
import { Flame, Swords, Plus, Activity, Users, Crown, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatChip } from "./StatChip";
import { formatCoins } from "@/lib/tournamentsUtils";

interface Props {
  liveCount: number;
  playerCount: number;
  prizePool: number;
  openRooms: number;
}

const Particles = () => (
  <div className="particle-field" aria-hidden>
    {Array.from({ length: 18 }).map((_, i) => (
      <span
        key={i}
        style={{
          left: `${(i * 5.5) % 100}%`,
          animationDuration: `${8 + (i % 6) * 1.5}s`,
          animationDelay: `${(i % 7) * 0.7}s`,
          width: `${2 + (i % 3)}px`,
          height: `${2 + (i % 3)}px`,
          opacity: 0.5 + ((i % 4) * 0.1),
        }}
      />
    ))}
  </div>
);

export const ArenaHero = ({ liveCount, playerCount, prizePool, openRooms }: Props) => (
  <section className="relative mb-8 overflow-hidden rounded-2xl border border-primary/30 bg-arena-mesh animate-bg-pan">
    {/* Floating glowing orbs */}
    <span className="orb orb-primary   left-[-60px]  top-[-40px]  h-56 w-56 animate-float" />
    <span className="orb orb-secondary right-[-40px] top-1/3      h-48 w-48 animate-float-slow" />
    <span className="orb orb-accent    left-1/3      bottom-[-60px] h-56 w-56 animate-float" style={{ animationDelay: "1.5s" }} />

    {/* Subtle grid */}
    <div className="absolute inset-0 bg-grid-fade" aria-hidden />
    <Particles />

    <div className="relative px-5 py-10 sm:px-10 sm:py-14">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur">
        <span className="live-dot" /> <Flame className="h-3 w-3" /> Live esports arena
      </div>

      <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
        COMPETE. WIN.
        <br />
        <span className="text-gradient-gold">CASH OUT.</span>
      </h1>

      <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
        Enter custom match rooms, prove your skill, and convert IG Coin winnings to real NPR.
        Built for Free Fire, PUBG, Mobile Legends and more.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg" className="btn-glow gap-2 font-semibold">
          <Link to="/tournaments/join"><Swords className="h-4 w-4" /> Quick Join</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2 border-primary/40 bg-background/60 backdrop-blur hover:bg-primary/10 hover:text-primary">
          <Link to="/tournaments/create"><Plus className="h-4 w-4" /> Create Match</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={Activity} label="Live now"     value={liveCount}             tint="emerald" pulse />
        <StatChip icon={Users}    label="Players"      value={playerCount}           tint="primary" />
        <StatChip icon={Crown}    label="Prize pool"   value={prizePool} suffix="IG" tint="amber" />
        <StatChip icon={Trophy}   label="Open rooms"   value={openRooms}             tint="violet" />
      </div>
    </div>
  </section>
);
