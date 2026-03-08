import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveBannerSlides, BannerSlide } from "@/lib/bannerApi";

export { type BannerSlide };

export const useBannerSlides = () => {
  const queryClient = useQueryClient();

  const { data: slides = [], isLoading: loading, error } = useQuery({
    queryKey: ["banner-slides"],
    queryFn: fetchActiveBannerSlides,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    const channel = supabase
      .channel("banner-slides-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "banner_slides" }, () => {
        queryClient.invalidateQueries({ queryKey: ["banner-slides"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { slides, loading, error: error as Error | null, refetch: () => queryClient.invalidateQueries({ queryKey: ["banner-slides"] }) };
};
