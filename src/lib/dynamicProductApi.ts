import { supabase } from "@/integrations/supabase/client";

// ---- Categories ----
export const fetchCategories = async () => {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
};

export const createCategory = async (name: string, slug: string) => {
  const { data: existing } = await supabase
    .from("product_categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("product_categories")
    .insert({ name, slug, display_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: { name?: string; slug?: string; display_order?: number; is_active?: boolean }) => {
  const { data, error } = await supabase
    .from("product_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from("product_categories").delete().eq("id", id);
  if (error) throw error;
};

// ---- Dynamic Products ----
export const fetchDynamicProducts = async () => {
  const { data, error } = await supabase
    .from("dynamic_products")
    .select("*, product_categories(id, name, slug)")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data;
};

export const createDynamicProduct = async (product: {
  title: string;
  description?: string;
  image_url?: string;
  link?: string;
  category_id?: string;
  price?: number;
  discount_price?: number;
  features?: any[];
  tags?: string[];
  plans?: any[];
}) => {
  const { data: existing } = await supabase
    .from("dynamic_products")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("dynamic_products")
    .insert({ ...product, display_order: nextOrder })
    .select("*, product_categories(id, name, slug)")
    .single();
  if (error) throw error;
  return data;
};

export const updateDynamicProduct = async (id: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from("dynamic_products")
    .update(updates)
    .eq("id", id)
    .select("*, product_categories(id, name, slug)")
    .single();
  if (error) throw error;
  return data;
};

export const deleteDynamicProduct = async (id: string) => {
  const { error } = await supabase.from("dynamic_products").delete().eq("id", id);
  if (error) throw error;
};

// ---- Image Upload ----
export const uploadProductImage = async (file: File) => {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
