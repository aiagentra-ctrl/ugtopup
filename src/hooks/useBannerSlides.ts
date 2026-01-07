import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveBannerSlides, BannerSlide } from "@/lib/bannerApi";

export const useBannerSlides = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSlides = async () => {
    try {
      const data = await fetchActiveBannerSlides();
      setSlides(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching banner slides:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("banner-slides-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "banner_slides",
        },
        () => {
          // Refetch on any change
          loadSlides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { slides, loading, error, refetch: loadSlides };
};
