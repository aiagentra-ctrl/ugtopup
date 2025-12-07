import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tiktokCoinPackages, TikTokPackage } from "@/data/tiktokPackages";
import { cn } from "@/lib/utils";

interface TikTokPackageSelectorProps {
  selectedPackage: TikTokPackage | null;
  onSelectPackage: (pkg: TikTokPackage) => void;
}

export const TikTokPackageSelector = ({ selectedPackage, onSelectPackage }: TikTokPackageSelectorProps) => {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
            2
          </span>
          Top-Up Amount
        </CardTitle>
        <CardDescription>
          Choose the number of TikTok coins you want to purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tiktokCoinPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                "group relative rounded-xl p-4 transition-all duration-300",
                "bg-card border-2 hover:bg-card/80",
                "flex flex-col items-center justify-center gap-2",
                selectedPackage?.id === pkg.id
                  ? "border-primary shadow-[0_0_24px_rgba(255,0,0,0.4)] scale-105"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="text-center">
                <p className={cn(
                  "font-bold text-base transition-colors",
                  selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                )}>
                  {pkg.quantity.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Coins</p>
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
