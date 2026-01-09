import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGamePrices } from "@/hooks/useGamePrices";
import { Loader2 } from "lucide-react";

export interface NetflixPackage {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

interface NetflixPackageSelectorProps {
  selectedPackage: NetflixPackage | null;
  onSelectPackage: (pkg: NetflixPackage) => void;
}

export const NetflixPackageSelector = ({ selectedPackage, onSelectPackage }: NetflixPackageSelectorProps) => {
  const { prices, loading } = useGamePrices('netflix');

  const packages: NetflixPackage[] = useMemo(() => {
    return prices.map((p) => ({
      id: p.package_id,
      name: p.package_name,
      duration: p.package_name.replace(' Netflix', ''),
      price: p.price,
      currency: p.currency,
    }));
  }, [prices]);

  if (loading) {
    return (
      <Card className="glass-card border-border/50">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
            2
          </span>
          Subscription Plans
        </CardTitle>
        <CardDescription>
          Choose your Netflix subscription duration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                "group relative rounded-xl p-4 transition-all duration-300",
                "bg-card border-2 hover:bg-card/80",
                "flex flex-col items-center justify-center gap-2",
                "min-h-[140px]",
                selectedPackage?.id === pkg.id
                  ? "border-primary shadow-[0_0_24px_rgba(255,0,0,0.4)] scale-105"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="text-4xl mb-1">🎬</div>
              <div className="text-center">
                <p className={cn(
                  "font-bold text-base transition-colors",
                  selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                )}>
                  {pkg.duration}
                </p>
                <p className="text-xs text-muted-foreground">Netflix</p>
              </div>
              <div className={cn(
                "text-lg font-bold transition-colors mt-1",
                selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
              )}>
                {pkg.currency}{pkg.price.toLocaleString()}
              </div>
              
              {selectedPackage?.id === pkg.id && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
