import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mlDiamondPackages, mlSpecialDeals, type MLPackage } from "@/data/mlPackages";
import { Check } from "lucide-react";

interface MLPackageSelectorProps {
  selectedPackage: MLPackage | null;
  onSelectPackage: (pkg: MLPackage) => void;
}

export const MLPackageSelector = ({ selectedPackage, onSelectPackage }: MLPackageSelectorProps) => {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
        <CardHeader>
          <CardTitle className="text-slate-100">Select Diamond Package</CardTitle>
          <CardDescription className="text-slate-400">
            Choose the amount of diamonds you want to purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mlDiamondPackages.map((pkg) => (
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
                  <div className="text-2xl">{pkg.icon}</div>
                  <div className="text-lg font-bold text-slate-100">{pkg.quantity}</div>
                  <div className="text-sm text-slate-400">Diamonds</div>
                  <div className="text-base font-semibold text-primary">
                    {pkg.currency} {pkg.price}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
        <CardHeader>
          <CardTitle className="text-slate-100">Special Deals</CardTitle>
          <CardDescription className="text-slate-400">
            Limited time offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {mlSpecialDeals.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onSelectPackage(pkg)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedPackage?.id === pkg.id
                    ? "border-secondary bg-secondary/10 shadow-lg shadow-secondary/40 scale-105 selected-pulse"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
                }`}
              >
                {selectedPackage?.id === pkg.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="text-center space-y-2">
                  <div className="text-3xl">{pkg.icon}</div>
                  <div className="text-lg font-bold text-slate-100">{pkg.name}</div>
                  <div className="text-base font-semibold text-secondary">
                    {pkg.currency} {pkg.price}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
