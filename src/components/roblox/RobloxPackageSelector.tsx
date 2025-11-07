import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { robloxPackages, type RobloxPackage } from "@/data/robloxPackages";
import { Check } from "lucide-react";

interface RobloxPackageSelectorProps {
  selectedPackage: RobloxPackage | null;
  onSelectPackage: (pkg: RobloxPackage) => void;
}

export const RobloxPackageSelector = ({ selectedPackage, onSelectPackage }: RobloxPackageSelectorProps) => {
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
          {robloxPackages.map((pkg) => (
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
                <div className="text-3xl">{pkg.icon}</div>
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
