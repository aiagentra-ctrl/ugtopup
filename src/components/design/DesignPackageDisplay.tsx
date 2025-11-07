import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DesignPackage } from "@/data/designPackages";
import { Check, Clock } from "lucide-react";

interface DesignPackageDisplayProps {
  package: DesignPackage;
}

export const DesignPackageDisplay = ({ package: pkg }: DesignPackageDisplayProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            2
          </div>
          <div>
            <CardTitle className="text-foreground">Package Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              What you'll get with this package
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Package Info */}
        <div className="flex items-start justify-between p-6 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 border-2 border-primary/20">
          <div className="flex-1">
            <div className="text-4xl mb-3">{pkg.icon}</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{pkg.name}</h3>
            <p className="text-muted-foreground mb-4">{pkg.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Delivery: {pkg.deliveryTime}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold text-primary">{pkg.currency}{pkg.price}</div>
            <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
          </div>
        </div>

        {/* Features List */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">What's Included:</h4>
          <div className="space-y-2">
            {pkg.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
