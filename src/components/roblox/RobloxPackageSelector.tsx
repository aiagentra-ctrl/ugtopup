import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useGamePrices } from "@/hooks/useGamePrices";

export interface RobloxPackage {
  id: string;
  type: 'robux';
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

interface RobloxPackageSelectorProps {
  selectedPackage: RobloxPackage | null;
  onSelectPackage: (pkg: RobloxPackage) => void;
}

export const RobloxPackageSelector = ({ selectedPackage, onSelectPackage }: RobloxPackageSelectorProps) => {
  const { prices, loading } = useGamePrices('roblox');

  const packages: RobloxPackage[] = useMemo(() => {
    return prices.map((p) => ({
      id: p.package_id,
      type: 'robux' as const,
      name: p.package_name,
      quantity: p.quantity,
      price: p.price,
      currency: p.currency,
    }));
  }, [prices]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-slate-100">Select Robux Package</CardTitle>
        <CardDescription className="text-slate-400">
          Choose the amount of Robux you want to purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                selectedPackage?.id === pkg.id
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/40 scale-105 selected-pulse"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
              }`}
            >
              {selectedPackage?.id === pkg.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-center space-y-2">
                <div className="text-lg font-bold text-slate-100">{pkg.quantity}</div>
                <div className="text-sm text-slate-400">Robux</div>
                <div className="text-base font-semibold text-primary">
                  {pkg.currency} {pkg.price}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
