import { useTrending, usePopular, useFrequentlyBoughtTogether } from "@/hooks/useRecommendations";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";
import { ProductCard } from "@/components/ProductCard";
import { TrendingUp, Flame, ShoppingBag } from "lucide-react";

interface RecommendationsProps {
  type: "trending" | "popular" | "frequently_bought";
  currentProductCategory?: string | null;
}

export const Recommendations = ({ type, currentProductCategory }: RecommendationsProps) => {
  const { data: trending = [] } = useTrending();
  const { data: popular = [] } = usePopular();
  const { data: fbt = [] } = useFrequentlyBoughtTogether(
    type === "frequently_bought" ? currentProductCategory ?? null : null
  );
  const { products } = useDynamicProducts();

  const items = type === "trending" ? trending : type === "popular" ? popular : fbt;

  if (!items.length) return null;

  // Map recommendation items to dynamic_products for images/links
  const productMap = new Map(products.map((p) => [p.title.toLowerCase(), p]));
  const mapped = items
    .map((item) => {
      const match = productMap.get(item.product_name.toLowerCase());
      return match ? { ...match, order_count: item.order_count } : null;
    })
    .filter(Boolean) as (typeof products[number] & { order_count: number })[];

  if (!mapped.length) return null;

  const config = {
    trending: { icon: Flame, title: "🔥 Trending Now", color: "text-orange-400" },
    popular: { icon: TrendingUp, title: "⭐ Most Popular", color: "text-yellow-400" },
    frequently_bought: { icon: ShoppingBag, title: "🛒 Frequently Bought Together", color: "text-primary" },
  };

  const { title, color } = config[type];

  return (
    <div className="space-y-4">
      <h2 className={`text-lg sm:text-xl font-bold ${color}`}>{title}</h2>
      <div className="grid grid-cols-3 gap-3">
        {mapped.slice(0, 3).map((product) => (
          <ProductCard
            key={product.id}
            image={product.image_url || "/placeholder.svg"}
            title={product.title}
            link={product.link || undefined}
            badgeText={product.offers?.badge_text || product.offer_badge_text || undefined}
            badgeColor={product.offers?.badge_color || product.offer_badge_color || undefined}
            badgeTextColor={product.offers?.badge_text_color || undefined}
            badgeAnimation={product.offers?.animation_type || undefined}
          />
        ))}
      </div>
    </div>
  );
};
