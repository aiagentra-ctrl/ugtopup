import { supabase } from "@/integrations/supabase/client";

export interface BannerSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerSlide {
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  cta_text?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateBannerSlide {
  image_url?: string;
  title?: string | null;
  subtitle?: string | null;
  cta_text?: string | null;
  display_order?: number;
  is_active?: boolean;
}

// Fetch all banner slides (admin)
export const fetchAllBannerSlides = async (): Promise<BannerSlide[]> => {
  const { data, error } = await supabase
    .from("banner_slides")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Fetch active banner slides (public)
export const fetchActiveBannerSlides = async (): Promise<BannerSlide[]> => {
  const { data, error } = await supabase
    .from("banner_slides")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Create a new banner slide
export const createBannerSlide = async (slide: CreateBannerSlide): Promise<BannerSlide> => {
  const { data, error } = await supabase
    .from("banner_slides")
    .insert(slide)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a banner slide
export const updateBannerSlide = async (id: string, updates: UpdateBannerSlide): Promise<BannerSlide> => {
  const { data, error } = await supabase
    .from("banner_slides")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a banner slide
export const deleteBannerSlide = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("banner_slides")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Upload banner image to storage
export const uploadBannerImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `banners/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("banner-images")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("banner-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Delete banner image from storage
export const deleteBannerImage = async (imageUrl: string): Promise<void> => {
  // Extract file path from URL
  const urlParts = imageUrl.split("/banner-images/");
  if (urlParts.length < 2) return; // External URL, skip deletion

  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from("banner-images")
    .remove([filePath]);

  if (error) {
    console.error("Error deleting banner image:", error);
  }
};

// Get next display order
export const getNextDisplayOrder = async (): Promise<number> => {
  const { data, error } = await supabase
    .from("banner_slides")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0]?.display_order || 0) + 1;
};
