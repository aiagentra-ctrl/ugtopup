import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useGamePrices } from "@/hooks/useGamePrices";

export interface UnipinPackage {
  id: string;
  type: 'uc';
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

interface UnipinPackageSelectorProps {
  selectedPackage: UnipinPackage | null;
  onSelectPackage: (pkg: UnipinPackage) => void;
}

export const UnipinPackageSelector = ({ selectedPackage, onSelectPackage }: UnipinPackageSelectorProps) => {
  const { prices, loading } = useGamePrices('unipin');

  const packages: UnipinPackage[] = useMemo(() => {
    return prices.map((p) => ({
      id: p.package_id,
      type: 'uc' as const,
      name: p.package_name,
      quantity: p.quantity,
      price: p.price,
      currency: p.currency,
    }));
  }, [prices]);

  if (loading) {
    return (
      <Card className="p-6 glass-card border-border/50">
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass-card border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
          2
        </span>
        Voucher Amount
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            onClick={() => onSelectPackage(pkg)}
            className={`p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedPackage?.id === pkg.id
                ? "border-primary shadow-[0_0_24px_rgba(255,0,0,0.4)] bg-card/80"
                : "border-border/50 bg-card/30 hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">UC</span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-base">{pkg.name}</p>
                  <p className={`text-sm font-semibold mt-1 ${
                    selectedPackage?.id === pkg.id ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {pkg.quantity.toLocaleString()} UC Points
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    selectedPackage?.id === pkg.id ? "text-primary" : "text-foreground"
                  }`}>
                    {pkg.currency}{pkg.price.toLocaleString()}
                  </p>
                </div>
                {selectedPackage?.id === pkg.id && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
