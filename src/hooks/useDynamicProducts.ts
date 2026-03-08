import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DynamicProduct {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  category_id: string | null;
  price: number;
  discount_price: number | null;
  features: any[];
  tags: string[];
  plans: any[];
  display_order: number;
  is_active: boolean;
  offer_id: string | null;
  offer_badge_text: string | null;
  offer_badge_color: string | null;
  product_categories?: { id: string; name: string; slug: string } | null;
  offers?: { id: string; badge_text: string | null; badge_color: string | null; badge_text_color: string | null; animation_type: string | null; design_template: string } | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

async function fetchProducts() {
  const { data, error } = await supabase
    .from("dynamic_products")
    .select("*, product_categories(id, name, slug), offers(id, badge_text, badge_color, badge_text_color, animation_type, design_template)")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data || []) as DynamicProduct[];
}

async function fetchCategories() {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return (data || []) as ProductCategory[];
}

export function useDynamicProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["dynamic-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Real-time subscription to invalidate cache
  useEffect(() => {
    const channel = supabase
      .channel("dynamic-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "dynamic_products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["dynamic-products"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "product_categories" }, () => {
        queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["dynamic-products"] });
    queryClient.invalidateQueries({ queryKey: ["product-categories"] });
  };

  return { products, categories, loading: productsLoading || categoriesLoading, refetch };
}
