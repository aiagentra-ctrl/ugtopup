import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { OpeningHours } from "@/components/OpeningHours";
import { BestDeals } from "@/components/BestDeals";
import { ProductTabs } from "@/components/ProductTabs";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8 pb-2 sm:pb-4">
          <HeroBanner />
        </section>

        {/* Opening Hours */}
        <OpeningHours />

        {/* Best Deals Banner */}
        <BestDeals />

        {/* Product Tabs */}
        <ProductTabs />

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Testimonials */}
        <Testimonials />
      </main>

      <Footer />

    </div>
  );
};

export default Index;
