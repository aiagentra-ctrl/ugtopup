import { useEffect, useState } from "react";
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

export function useOffers(location: "homepage" | "product_page" | "all" = "all") {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    let query = supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .or("timer_end_date.is.null,timer_end_date.gt.now()")
      .or("timer_start_date.is.null,timer_start_date.lte.now()")
      .order("display_order");

    if (location === "homepage") query = query.eq("show_on_homepage", true);
    if (location === "product_page") query = query.eq("show_on_product_page", true);

    const { data } = await query;
    if (data) setOffers(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();

    const channel = supabase
      .channel("offers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => fetchOffers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [location]);

  return { offers, loading, refetch: fetchOffers };
}
