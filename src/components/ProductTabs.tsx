import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";

import productUnipin from "@/assets/product-unipin.jpg";
import productGarena from "@/assets/product-garena.jpg";
import productSmile from "@/assets/product-smile.jpg";
import productNetflix from "@/assets/product-netflix.jpg";
import productYoutube from "@/assets/product-youtube.jpg";
import productCapcut from "@/assets/product-capcut.jpg";

const productData = {
  topup: [
    { id: 1, title: "Free Fire Diamond", image: "https://i.ibb.co/C5spS0zQ/SAVE-20251108-163350.jpg", link: "/product/freefire-diamond" },
    { id: 2, title: "Mobile Legends Diamond", image: "https://i.ibb.co/KjW0Ptdt/SAVE-20251108-180521.jpg", link: "/product/mobile-legends" },
    { id: 3, title: "TikTok Coins", image: "https://i.ibb.co/H0FwhXn/SAVE-20251108-180527.jpg", link: "/product/tiktok-coins" },
    { id: 4, title: "Roblox Robux", image: "https://i.ibb.co/0pYYFxyL/SAVE-20251108-163423.jpg", link: "/product/roblox-topup" },
    { id: 5, title: "PUBG Mobile UC", image: "https://i.ibb.co/SDDFYS1T/SAVE-20251108-163359.jpg", link: "/product/pubg-mobile" },
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
    { id: 1, title: "Logo Design", image: "https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg", link: "/product/logo-design" },
    { id: 2, title: "Post Design", image: "https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg", link: "/product/post-design" },
    { id: 3, title: "Banner Design", image: "https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg", link: "/product/banner-design" },
    { id: 4, title: "Thumbnail Design", image: "https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg", link: "/product/thumbnail-design" },
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
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4">
            {productData.design.map((product) => (
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
      </Tabs>
    </section>
  );
};
