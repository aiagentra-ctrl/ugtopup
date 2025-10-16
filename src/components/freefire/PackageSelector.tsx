import { useState } from "react";
import { Package, diamondPackages, subscriptionPackages, zonePackages, specialPassPackages } from "@/data/freefirePackages";
import { PackageCard } from "./PackageCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface PackageSelectorProps {
  selectedPackage: Package | null;
  onSelectPackage: (pkg: Package) => void;
}

const PackageSection = ({ 
  packages, 
  selectedPackage, 
  onSelectPackage 
}: { 
  packages: Package[]; 
  selectedPackage: Package | null; 
  onSelectPackage: (pkg: Package) => void;
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayPackages = showAll ? packages : packages.slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            isSelected={selectedPackage?.id === pkg.id}
            onSelect={() => onSelectPackage(pkg)}
          />
        ))}
      </div>
      {packages.length > 6 && !showAll && (
        <Button
          variant="outline"
          onClick={() => setShowAll(true)}
          className="w-full"
        >
          Show More ({packages.length - 6} more)
        </Button>
      )}
      {showAll && (
        <Button
          variant="ghost"
          onClick={() => setShowAll(false)}
          className="w-full"
        >
          Show Less
        </Button>
      )}
    </div>
  );
};

export const PackageSelector = ({ selectedPackage, onSelectPackage }: PackageSelectorProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Select Package</h2>
      
      <Accordion type="multiple" defaultValue={["diamonds"]} className="space-y-3">
        <AccordionItem value="diamonds" className="border border-border rounded-lg bg-card/50 px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-lg font-semibold">💎 Diamond Packages ({diamondPackages.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <PackageSection
              packages={diamondPackages}
              selectedPackage={selectedPackage}
              onSelectPackage={onSelectPackage}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="subscriptions" className="border border-border rounded-lg bg-card/50 px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-lg font-semibold">🗓️ Subscription Packages ({subscriptionPackages.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <PackageSection
              packages={subscriptionPackages}
              selectedPackage={selectedPackage}
              onSelectPackage={onSelectPackage}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="zone" className="border border-border rounded-lg bg-card/50 px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-lg font-semibold">⚔️ Zone Packages ({zonePackages.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <PackageSection
              packages={zonePackages}
              selectedPackage={selectedPackage}
              onSelectPackage={onSelectPackage}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="passes" className="border border-border rounded-lg bg-card/50 px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-lg font-semibold">🎟️ Special Passes ({specialPassPackages.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <PackageSection
              packages={specialPassPackages}
              selectedPackage={selectedPackage}
              onSelectPackage={onSelectPackage}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
