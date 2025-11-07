import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";

import productFreefire from "@/assets/product-freefire.jpg";
import productMl from "@/assets/product-ml.jpg";
import productTiktok from "@/assets/product-tiktok.jpg";
import gameRoblox from "@/assets/game-roblox.jpg";
import productUnipin from "@/assets/product-unipin.jpg";
import productGarena from "@/assets/product-garena.jpg";
import productSmile from "@/assets/product-smile.jpg";
import productNetflix from "@/assets/product-netflix.jpg";
import productYoutube from "@/assets/product-youtube.jpg";
import productCapcut from "@/assets/product-capcut.jpg";

const productData = {
  topup: [
    { id: 1, title: "Free Fire Diamond 🔥", image: productFreefire, link: "/product/freefire-diamond" },
    { id: 2, title: "Mobile Legends Diamond", image: productMl, link: "/product/mobile-legends" },
    { id: 3, title: "TikTok Coins", image: productTiktok, link: "/product/tiktok-coins" },
    { id: 4, title: "Roblox Robux Top-Ups", image: gameRoblox, link: "/product/roblox-topup" },
  ],
  voucher: [
    { id: 1, title: "Unipin UC", image: productUnipin, link: "/product/unipin-uc" },
    { id: 2, title: "Smile Coin", image: productSmile, link: "/product/smile-coin" },
    { id: 3, title: "Garena Shell", image: productGarena, link: "/product/garena-shell" },
  ],
  subscription: [
    { id: 1, title: "ChatGPT Plus", image: productCapcut, link: "/product/chatgpt-plus" },
    { id: 2, title: "YouTube Premium", image: productYoutube, link: "/product/youtube-premium" },
    { id: 3, title: "Netflix Subscription", image: productNetflix, link: "/product/netflix" },
  ],
  design: [
    { id: 1, title: "Logo Designs", image: "https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=400&h=400&fit=crop" },
    { id: 2, title: "Post Designs", image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop" },
    { id: 3, title: "Banner Designs", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop" },
  ],
};

export const ProductTabs = () => {
  const { toast } = useToast();

  const handleBuyNow = (productTitle: string) => {
    toast({
      title: "Added to cart!",
      description: `${productTitle} has been added to your cart.`,
    });
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <Tabs defaultValue="topup" className="w-full">
        <TabsList className="mb-10 flex justify-center items-center w-full bg-transparent p-2 h-auto gap-2 sm:gap-3 md:gap-4">
          <TabsTrigger 
            value="topup"
            className="rounded-lg px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 min-w-[80px] sm:min-w-[110px] md:min-w-[130px] flex-shrink-0 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase transition-all duration-300 ease-out whitespace-nowrap bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300 border border-neutral-700 hover:scale-[1.03] hover:shadow-lg hover:border-neutral-600 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/40"
          >
            TOPUP
          </TabsTrigger>
          <TabsTrigger 
            value="voucher"
            className="rounded-lg px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 min-w-[80px] sm:min-w-[110px] md:min-w-[130px] flex-shrink-0 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase transition-all duration-300 ease-out whitespace-nowrap bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300 border border-neutral-700 hover:scale-[1.03] hover:shadow-lg hover:border-neutral-600 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/40"
          >
            VOUCHER
          </TabsTrigger>
          <TabsTrigger 
            value="subscription"
            className="rounded-lg px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 min-w-[80px] sm:min-w-[110px] md:min-w-[130px] flex-shrink-0 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase transition-all duration-300 ease-out whitespace-nowrap bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300 border border-neutral-700 hover:scale-[1.03] hover:shadow-lg hover:border-neutral-600 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/40"
          >
            SUBSCRIPTION
          </TabsTrigger>
          <TabsTrigger 
            value="design"
            className="rounded-lg px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 min-w-[80px] sm:min-w-[110px] md:min-w-[130px] flex-shrink-0 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase transition-all duration-300 ease-out whitespace-nowrap bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-300 border border-neutral-700 hover:scale-[1.03] hover:shadow-lg hover:border-neutral-600 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-400 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/40"
          >
            DESIGN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topup" className="animate-fade-in">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {productData.topup.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                title={product.title}
                link={product.link}
                onBuyNow={() => handleBuyNow(product.title)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="voucher" className="animate-fade-in">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-3">
            {productData.voucher.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                title={product.title}
                link={product.link}
                onBuyNow={() => handleBuyNow(product.title)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="animate-fade-in">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4">
            {productData.subscription.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                title={product.title}
                link={product.link}
                onBuyNow={() => handleBuyNow(product.title)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="design" className="animate-fade-in">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-3">
            {productData.design.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                title={product.title}
                onBuyNow={() => handleBuyNow(product.title)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};
