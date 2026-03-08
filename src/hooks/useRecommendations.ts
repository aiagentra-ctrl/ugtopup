import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RecommendationItem {
  product_name: string;
  product_category: string;
  order_count: number;
}

async function fetchTrending(): Promise<RecommendationItem[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("product_orders")
    .select("product_name, product_category")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Group and count
  const counts = new Map<string, RecommendationItem>();
  for (const row of data || []) {
    const key = row.product_name;
    const existing = counts.get(key);
    if (existing) {
      existing.order_count++;
    } else {
      counts.set(key, {
        product_name: row.product_name,
        product_category: row.product_category,
        order_count: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, 8);
}

async function fetchPopular(): Promise<RecommendationItem[]> {
  const { data, error } = await supabase
    .from("product_orders")
    .select("product_name, product_category")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  const counts = new Map<string, RecommendationItem>();
  for (const row of data || []) {
    const key = row.product_name;
    const existing = counts.get(key);
    if (existing) {
      existing.order_count++;
    } else {
      counts.set(key, {
        product_name: row.product_name,
        product_category: row.product_category,
        order_count: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, 8);
}

async function fetchFrequentlyBoughtTogether(category: string): Promise<RecommendationItem[]> {
  // Find users who ordered in this category
  const { data: categoryOrders, error: err1 } = await supabase
    .from("product_orders")
    .select("user_id")
    .eq("product_category", category as any)
    .limit(200);

  if (err1) throw err1;
  if (!categoryOrders?.length) return [];

  const userIds = [...new Set(categoryOrders.map((o) => o.user_id))].slice(0, 50);

  // Find what else those users ordered
  const { data: otherOrders, error: err2 } = await supabase
    .from("product_orders")
    .select("product_name, product_category")
    .in("user_id", userIds)
    .neq("product_category", category as any)
    .limit(500);

  if (err2) throw err2;

  const counts = new Map<string, RecommendationItem>();
  for (const row of otherOrders || []) {
    const key = row.product_name;
    const existing = counts.get(key);
    if (existing) {
      existing.order_count++;
    } else {
      counts.set(key, {
        product_name: row.product_name,
        product_category: row.product_category,
        order_count: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, 6);
}

export function useTrending() {
  return useQuery({
    queryKey: ["recommendations", "trending"],
    queryFn: fetchTrending,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export function usePopular() {
  return useQuery({
    queryKey: ["recommendations", "popular"],
    queryFn: fetchPopular,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export function useFrequentlyBoughtTogether(category: string | null) {
  return useQuery({
    queryKey: ["recommendations", "fbt", category],
    queryFn: () => fetchFrequentlyBoughtTogether(category!),
    enabled: !!category,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
