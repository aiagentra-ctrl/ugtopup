import { ShoppingCart, Shield, Heart, Award } from "lucide-react";

const features = [
  { icon: ShoppingCart, title: "Instant Delivery", description: "Get your credits instantly after payment" },
  { icon: Shield, title: "Secure Payment", description: "100% safe and encrypted transactions" },
  { icon: Heart, title: "24/7 Support", description: "Always here to help you anytime" },
  { icon: Award, title: "Best Prices", description: "Guaranteed cheapest rates in market" },
];

export const WhyChooseUs = () => {
  return (
    <section className="relative py-10 sm:py-16 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="orb orb-primary w-72 h-72 -top-20 -left-20 animate-float-slow" />
      <div className="orb orb-secondary w-80 h-80 -bottom-24 -right-16 animate-float" />

      <div className="container mx-auto px-3 sm:px-4 relative">
        <h2 className="mb-3 sm:mb-4 text-center text-2xl font-bold sm:text-3xl md:text-4xl">
          Why Choose <span className="animated-gradient-text">UG TOP-UP</span>?
        </h2>
        <p className="mx-auto mb-8 sm:mb-12 max-w-2xl text-center text-sm sm:text-base text-muted-foreground">
          We provide the fastest, most secure, and affordable gaming top-up service.
          Your trust and satisfaction are our top priorities.
        </p>

        <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                style={{ animationDelay: `${i * 80}ms` }}
                className="group card-premium sheen glass-premium-hover rounded-xl p-4 sm:p-6 animate-fade-in"
              >
                <div className="mb-3 sm:mb-4 inline-flex rounded-lg bg-primary/10 p-2 sm:p-3 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mb-1 sm:mb-2 text-base sm:text-lg font-semibold transition-colors group-hover:text-primary">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
