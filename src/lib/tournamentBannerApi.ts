import { supabase } from "@/integrations/supabase/client";

export interface TournamentBanner {
  id: string;
  title: string | null;
  message: string;
  image_url: string | null;
  variant: string; // 'warning' | 'info' | 'success' | 'promo'
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type CreateTournamentBanner = Partial<Omit<TournamentBanner, "id" | "created_at" | "updated_at">> & {
  message: string;
};
export type UpdateTournamentBanner = Partial<Omit<TournamentBanner, "id" | "created_at" | "updated_at">>;

export const fetchActiveTournamentBanners = async (): Promise<TournamentBanner[]> => {
  const { data, error } = await supabase
    .from("tournament_banners" as any)
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as any) || [];
};

export const fetchAllTournamentBanners = async (): Promise<TournamentBanner[]> => {
  const { data, error } = await supabase
    .from("tournament_banners" as any)
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data as any) || [];
};

export const createTournamentBanner = async (b: CreateTournamentBanner): Promise<TournamentBanner> => {
  const { data, error } = await supabase
    .from("tournament_banners" as any)
    .insert(b as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
};

export const updateTournamentBanner = async (id: string, updates: UpdateTournamentBanner): Promise<TournamentBanner> => {
  const { data, error } = await supabase
    .from("tournament_banners" as any)
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as any;
};

export const deleteTournamentBanner = async (id: string): Promise<void> => {
  const { error } = await supabase.from("tournament_banners" as any).delete().eq("id", id);
  if (error) throw error;
};
