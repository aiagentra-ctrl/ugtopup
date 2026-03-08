import { ShoppingCart, Shield, Heart, Award } from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Instant Delivery",
    description: "Get your credits instantly after payment",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% safe and encrypted transactions",
  },
  {
    icon: Heart,
    title: "24/7 Support",
    description: "Always here to help you anytime",
  },
  {
    icon: Award,
    title: "Best Prices",
    description: "Guaranteed cheapest rates in market",
  },
];

export const WhyChooseUs = () => {
  return (
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-3 sm:px-4">
        <h2 className="mb-3 sm:mb-4 text-center text-2xl font-bold sm:text-3xl md:text-4xl">
          Why Choose <span className="text-primary">UG TOP-UP</span>?
        </h2>
        <p className="mx-auto mb-8 sm:mb-12 max-w-2xl text-center text-sm sm:text-base text-muted-foreground">
          We provide the fastest, most secure, and affordable gaming top-up service. 
          Your trust and satisfaction are our top priorities.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary glass-card"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
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
