import { Package } from "@/data/freefirePackages";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  package: Package;
  isSelected: boolean;
  onSelect: () => void;
}

export const PackageCard = ({ package: pkg, isSelected, onSelect }: PackageCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-lg p-4 transition-all duration-300",
        "bg-card border-2 hover:bg-card/80",
        isSelected
          ? "border-primary glow-border scale-105"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-left">
          <span className="text-2xl">💎</span>
          <div>
            <p className={cn(
              "font-semibold transition-colors",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {pkg.quantity} {pkg.type === 'diamond' || pkg.type === 'zone' ? '💎' : ''}
            </p>
            <p className="text-xs text-muted-foreground">{pkg.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-xl font-bold transition-colors",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {pkg.price}{pkg.currency}
          </p>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
    </button>
  );
};
