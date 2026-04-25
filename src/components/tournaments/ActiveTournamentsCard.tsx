import { useEffect, useState } from "react";
import { Activity, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subscribeTournaments } from "@/lib/tournamentsApi";

export const ActiveTournamentsCard = () => {
  const [live, setLive] = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [players, setPlayers] = useState(0);
  const [capacity, setCapacity] = useState(0);

  const load = async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("status, current_players, max_players")
      .in("status", ["upcoming", "live"]);
    if (!data) return;
    const liveCount = data.filter((t: any) => t.status === "live").length;
    const upCount = data.filter((t: any) => t.status === "upcoming").length;
    const totalPlayers = data.reduce((s: number, t: any) => s + (Number(t.current_players) || 0), 0);
    const totalCap = data.reduce((s: number, t: any) => s + (Number(t.max_players) || 0), 0);
    setLive(liveCount);
    setUpcoming(upCount);
    setPlayers(totalPlayers);
    setCapacity(totalCap ? Math.round((totalPlayers / totalCap) * 100) : 0);
  };

  useEffect(() => {
    load();
    const unsub = subscribeTournaments(load);
    return unsub;
  }, []);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-[14px] font-medium text-foreground">
        <Activity className="h-4 w-4 text-primary" />
        Live arena
      </h3>
      <div className="text-3xl font-semibold text-foreground">{live}</div>
      <div className="text-[12px] text-muted-foreground">tournaments running now</div>
      <div className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span className="text-foreground">{players}</span> players in matches · {upcoming} upcoming
      </div>
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${capacity}%` }} />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{capacity}% room capacity filled</div>
      </div>
    </div>
  );
};
