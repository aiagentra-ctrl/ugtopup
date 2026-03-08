import { useEffect, useState } from "react";
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

export function useDynamicProducts() {
  const [products, setProducts] = useState<DynamicProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("dynamic_products")
          .select("*, product_categories(id, name, slug), offers(id, badge_text, badge_color, badge_text_color, animation_type, design_template)")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("product_categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
      ]);
      if (prodRes.data) setProducts(prodRes.data as any);
      if (catRes.data) setCategories(catRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();

    const prodChannel = supabase
      .channel("dynamic-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "dynamic_products" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "product_categories" }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(prodChannel); };
  }, []);

  return { products, categories, loading, refetch: fetchAll };
}
