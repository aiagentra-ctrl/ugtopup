import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";

// Fallback imports for local images used in seed data
import productUnipin from "@/assets/product-unipin.jpg";
import productGarena from "@/assets/product-garena.jpg";
import productSmile from "@/assets/product-smile.jpg";
import productNetflix from "@/assets/product-netflix.jpg";
import productYoutube from "@/assets/product-youtube.jpg";
import productChatgpt from "@/assets/product-chatgpt.jpg";

// Map local asset paths to actual imports
const localAssetMap: Record<string, string> = {
  "/assets/product-unipin.jpg": productUnipin,
  "/assets/product-garena.jpg": productGarena,
  "/assets/product-smile.jpg": productSmile,
  "/assets/product-netflix.jpg": productNetflix,
  "/assets/product-youtube.jpg": productYoutube,
  "/assets/product-chatgpt.jpg": productChatgpt,
};

const resolveImage = (url: string | null) => {
  if (!url) return "";
  return localAssetMap[url] || url;
};

export const ProductTabs = () => {
  const { toast } = useToast();
  const { products, categories, loading } = useDynamicProducts();

  const handleBuyNow = (productTitle: string) => {
    toast({
      title: "Added to cart!",
      description: `${productTitle} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="text-center py-10 text-muted-foreground">Loading products...</div>
      </section>
    );
  }

  const defaultTab = categories[0]?.slug || "topup";

  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="mb-6 sm:mb-10 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
          <TabsList className="flex justify-start sm:justify-center items-center w-max sm:w-full bg-transparent p-1 sm:p-2 h-auto gap-2 sm:gap-3 md:gap-4">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.slug}
                value={cat.slug}
                className="rounded-lg px-3 py-2.5 sm:px-6 sm:py-3.5 md:px-8 min-w-[70px] sm:min-w-[110px] md:min-w-[130px] flex-shrink-0 text-[11px] sm:text-sm md:text-base font-medium tracking-wide uppercase transition-all duration-300 ease-out whitespace-nowrap bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300 border border-neutral-700 hover:scale-[1.03] hover:shadow-lg hover:border-neutral-600 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/40"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((cat) => {
          const catProducts = products.filter(
            (p) => p.product_categories?.slug === cat.slug
          );
          const gridCols = catProducts.length <= 3
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

          return (
            <TabsContent key={cat.slug} value={cat.slug} className="animate-fade-in">
              <div className={`grid gap-4 sm:gap-6 ${gridCols}`}>
                {catProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    image={resolveImage(product.image_url)}
                    title={product.title}
                    link={product.link || "#"}
                    onBuyNow={() => handleBuyNow(product.title)}
                  />
                ))}
              </div>
              {catProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No products in this category yet.</p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
};
