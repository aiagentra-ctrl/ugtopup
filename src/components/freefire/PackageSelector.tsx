import { Package, topUpPackages, specialDeals } from "@/data/freefirePackages";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackageSelectorProps {
  selectedPackage: Package | null;
  onSelectPackage: (pkg: Package) => void;
}

export const PackageSelector = ({ selectedPackage, onSelectPackage }: PackageSelectorProps) => {
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
                "relative rounded-xl p-4 min-h-[100px] transition-all duration-200",
                "bg-card border-2 flex flex-col items-center justify-center gap-2",
                "hover:border-primary hover:shadow-lg active:scale-95",
                selectedPackage?.id === pkg.id
                  ? "border-primary shadow-[0_0_20px_rgba(255,0,0,0.3)] scale-105"
                  : "border-border"
              )}
            >
              {/* Diamond Icon */}
              <div className="text-2xl">💎</div>
              
              {/* Quantity */}
              <div className="text-center">
                <p className={cn(
                  "text-sm sm:text-base font-semibold transition-colors",
                  selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                )}>
                  {pkg.quantity}
                </p>
                <p className="text-xs text-muted-foreground">Diamonds</p>
              </div>
              
              {/* Price */}
              <p className={cn(
                "text-sm font-bold transition-colors",
                selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
              )}>
                ₹{pkg.price}
              </p>

              {/* Selected Checkmark */}
              {selectedPackage?.id === pkg.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                  <span className="text-xs text-primary-foreground">✓</span>
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
                "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                "bg-card border-2 hover:border-primary hover:shadow-lg active:scale-95",
                selectedPackage?.id === pkg.id
                  ? "border-primary shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                  : "border-border"
              )}
            >
              {/* Left: Deal Name */}
              <div className="text-left">
                <p className={cn(
                  "text-base font-semibold transition-colors",
                  selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                )}>
                  {pkg.name}
                </p>
                <p className="text-xs text-muted-foreground">Membership</p>
              </div>
              
              {/* Center: Price */}
              <p className={cn(
                "text-lg font-bold transition-colors mr-2",
                selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
              )}>
                ₹{pkg.price}
              </p>
              
              {/* Right: Arrow Icon */}
              <ChevronRight className={cn(
                "w-5 h-5 transition-colors",
                selectedPackage?.id === pkg.id ? "text-primary" : "text-muted-foreground"
              )} />

              {/* Selected Checkmark */}
              {selectedPackage?.id === pkg.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                  <span className="text-xs text-primary-foreground">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
