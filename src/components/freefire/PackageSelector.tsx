import { Package } from "@/data/freefirePackages";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamePrices } from "@/hooks/useGamePrices";
import { useMemo } from "react";

interface PackageSelectorProps {
  selectedPackage: Package | null;
  onSelectPackage: (pkg: Package) => void;
}

export const PackageSelector = ({ selectedPackage, onSelectPackage }: PackageSelectorProps) => {
  const { prices, loading, getPricesByType } = useGamePrices('freefire');

  // Convert DB prices to Package format with real-time prices
  const topUpPackages = useMemo(() => {
    const dbPrices = getPricesByType('topup');
    return dbPrices.map((p) => ({
      id: p.package_id,
      type: 'topup' as const,
      name: p.package_name,
      quantity: p.quantity,
      price: p.price,
      currency: '💵' as const,
    }));
  }, [prices]);

  const specialDeals = useMemo(() => {
    const dbPrices = getPricesByType('special');
    return dbPrices.map((p) => ({
      id: p.package_id,
      type: 'special' as const,
      name: p.package_name,
      quantity: p.quantity,
      price: p.price,
      currency: '💵' as const,
    }));
  }, [prices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading prices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top-up Amount Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            2
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Top-up Amount
          </h2>
        </div>

        {/* Diamond Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {topUpPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                "relative rounded-xl p-4 min-h-[110px] transition-all duration-300",
                "bg-card/50 backdrop-blur-sm border-2 flex flex-col items-center justify-center gap-2.5",
                "hover:border-primary hover:shadow-[0_4px_16px_rgba(255,0,0,0.2)] hover:scale-105",
                "active:scale-95",
                selectedPackage?.id === pkg.id
                  ? "border-primary shadow-[0_0_24px_rgba(255,0,0,0.4)] scale-105 bg-primary/10 selected-pulse"
                  : "border-border"
              )}
            >
              {/* Diamond Icon */}
              <div className="text-3xl filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]">
                💎
              </div>
              
              {/* Quantity */}
              <div className="text-center">
                <p className={cn(
                  "text-lg sm:text-xl font-bold transition-colors leading-none",
                  selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                )}>
                  {pkg.quantity.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
                  Diamonds
                </p>
              </div>
              
              {/* Price */}
              <p className={cn(
                "text-base sm:text-lg font-extrabold transition-colors",
                selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
              )}>
                ₹{pkg.price}
              </p>

              {/* Selected Checkmark */}
              {selectedPackage?.id === pkg.id && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in border-2 border-background">
                  <span className="text-sm text-primary-foreground font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Special Deal Section */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Special Deal
        </h2>

        {/* Deal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {specialDeals.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                "relative flex items-center justify-between p-5 rounded-xl transition-all duration-300",
                "bg-card/50 backdrop-blur-sm border-2",
                "hover:border-primary hover:shadow-[0_8px_24px_rgba(255,0,0,0.25)] hover:scale-[1.02]",
                "active:scale-[0.98]",
                selectedPackage?.id === pkg.id
                  ? "border-primary shadow-[0_0_32px_rgba(255,0,0,0.5)] scale-[1.02] bg-primary/10 selected-pulse"
                  : "border-border hover:bg-card/80"
              )}
            >
              {/* Left: Deal Name */}
              <div className="text-left flex-1">
                <p className={cn(
                  "text-base sm:text-lg font-bold transition-colors",
                  selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                )}>
                  {pkg.name}
                </p>
              </div>
              
              {/* Center: Price */}
              <p className={cn(
                "text-xl sm:text-2xl font-extrabold transition-colors mr-3",
                selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
              )}>
                ₹{pkg.price}
              </p>
              
              {/* Right: Arrow Icon */}
              <ChevronRight className={cn(
                "w-6 h-6 transition-all duration-300",
                selectedPackage?.id === pkg.id 
                  ? "text-primary translate-x-1" 
                  : "text-muted-foreground"
              )} />

              {/* Selected Indicator */}
              {selectedPackage?.id === pkg.id && (
                <>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in border-2 border-background z-10">
                    <span className="text-sm text-primary-foreground font-bold">✓</span>
                  </div>
                  
                  {/* Animated Border Glow */}
                  <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse pointer-events-none" />
                </>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
