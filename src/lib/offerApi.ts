import { supabase } from "@/integrations/supabase/client";

export const fetchOffers = async () => {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
};

export const createOffer = async (offer: {
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  offer_type?: string;
  timer_enabled?: boolean;
  timer_type?: string;
  timer_end_date?: string;
  product_link?: string;
  custom_icon_url?: string;
  show_on_homepage?: boolean;
  show_on_product_page?: boolean;
  design_template?: string;
  badge_text?: string;
  badge_color?: string;
  badge_text_color?: string;
  animation_type?: string;
  seasonal_theme?: string;
  background_gradient?: string;
  timer_start_date?: string;
}) => {
  const { data: existing } = await supabase
    .from("offers")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("offers")
    .insert({ ...offer, display_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateOffer = async (id: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from("offers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteOffer = async (id: string) => {
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw error;
};
