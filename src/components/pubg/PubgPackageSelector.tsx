import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pubgPackages, PubgPackage } from "@/data/pubgPackages";

interface PubgPackageSelectorProps {
  selectedPackage: PubgPackage | null;
  onSelectPackage: (pkg: PubgPackage) => void;
}

export const PubgPackageSelector = ({ selectedPackage, onSelectPackage }: PubgPackageSelectorProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Select UC Package</CardTitle>
        <CardDescription>Choose your desired UC amount</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {pubgPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                ${
                  selectedPackage?.id === pkg.id
                    ? "bg-gradient-to-br from-primary/20 via-red-600/20 to-secondary/20 border-primary shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                    : "bg-card/80 border-border hover:border-primary/50"
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-center">
                  <p className="font-bold text-lg text-foreground">{pkg.quantity} UC</p>
                  <p className="text-sm text-primary font-semibold">₹{pkg.price}</p>
                </div>
              </div>
              {selectedPackage?.id === pkg.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
