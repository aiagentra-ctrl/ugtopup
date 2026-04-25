import { supabase } from "@/integrations/supabase/client";

export interface GamePageDescription {
  id: string;
  page_slug: string;
  title: string | null;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchAllGamePageDescriptions = async (): Promise<GamePageDescription[]> => {
  const { data, error } = await supabase
    .from("game_page_descriptions")
    .select("*")
    .order("page_slug", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GamePageDescription[];
};

export const fetchGamePageDescription = async (
  slug: string
): Promise<GamePageDescription | null> => {
  const { data, error } = await supabase
    .from("game_page_descriptions")
    .select("*")
    .eq("page_slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as GamePageDescription) ?? null;
};

export const upsertGamePageDescription = async (input: {
  page_slug: string;
  title?: string | null;
  description: string;
  is_active?: boolean;
}): Promise<GamePageDescription> => {
  const { data, error } = await supabase
    .from("game_page_descriptions")
    .upsert(
      {
        page_slug: input.page_slug,
        title: input.title ?? null,
        description: input.description,
        is_active: input.is_active ?? true,
      },
      { onConflict: "page_slug" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as GamePageDescription;
};
