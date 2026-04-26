import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveTournamentBanners, TournamentBanner } from "@/lib/tournamentBannerApi";

export type { TournamentBanner };

export const useTournamentBanners = () => {
  const queryClient = useQueryClient();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["tournament-banners-active"],
    queryFn: fetchActiveTournamentBanners,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    const channel = supabase
      .channel("tournament-banners-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_banners" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tournament-banners-active"] });
        queryClient.invalidateQueries({ queryKey: ["tournament-banners-all"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { banners, isLoading };
};
