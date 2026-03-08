import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  offer_type: string;
  timer_enabled: boolean;
  timer_type: string | null;
  timer_end_date: string | null;
  product_link: string | null;
  custom_icon_url: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  show_on_product_page: boolean;
  design_template: string;
  badge_text: string | null;
  badge_color: string | null;
  badge_text_color: string | null;
  animation_type: string | null;
  seasonal_theme: string | null;
  background_gradient: string | null;
  timer_start_date: string | null;
}

async function fetchOffers(location: "homepage" | "product_page" | "all") {
  let query = supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .or("timer_end_date.is.null,timer_end_date.gt.now()")
    .or("timer_start_date.is.null,timer_start_date.lte.now()")
    .order("display_order");

  if (location === "homepage") query = query.eq("show_on_homepage", true);
  if (location === "product_page") query = query.eq("show_on_product_page", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Offer[];
}

export function useOffers(location: "homepage" | "product_page" | "all" = "all") {
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading: loading } = useQuery({
    queryKey: ["offers", location],
    queryFn: () => fetchOffers(location),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`offers-realtime-${location}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["offers"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [location, queryClient]);

  return { offers, loading, refetch: () => queryClient.invalidateQueries({ queryKey: ["offers"] }) };
}
