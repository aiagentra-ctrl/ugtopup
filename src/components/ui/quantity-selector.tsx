import { Minus, Plus } from "lucide-react";
import { Button } from "./button";
import { toast } from "sonner";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  unitPrice?: number;
  unitQuantity?: number;
  currency?: string;
  itemLabel?: string;
}

export const QuantitySelector = ({
  value,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
  unitPrice,
  unitQuantity,
  currency = "₹",
  itemLabel = "items",
}: QuantitySelectorProps) => {
  const handleDecrease = () => {
    if (value > min) {
      const newValue = value - 1;
      onChange(newValue);
      if (unitPrice && unitQuantity) {
        toast.info(`Quantity: ${newValue} × ${unitQuantity} ${itemLabel} = ${currency}${(unitPrice * newValue).toLocaleString()}`);
      }
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      const newValue = value + 1;
      onChange(newValue);
      if (unitPrice && unitQuantity) {
        toast.info(`Quantity: ${newValue} × ${unitQuantity} ${itemLabel} = ${currency}${(unitPrice * newValue).toLocaleString()}`);
      }
    }
  };

  const totalPrice = unitPrice ? unitPrice * value : null;
  const totalItems = unitQuantity ? unitQuantity * value : null;

  return (
    <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Purchase Quantity</span>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
            onClick={handleDecrease}
            disabled={disabled || value <= min}
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <span className="text-2xl font-bold text-foreground min-w-[3rem] text-center">
            {value}
          </span>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary transition-all"
            onClick={handleIncrease}
            disabled={disabled || value >= max}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {totalPrice !== null && totalItems !== null && (
        <div className="flex items-center justify-between text-sm pt-2 border-t border-border/30">
          <span className="text-muted-foreground">
            {unitQuantity?.toLocaleString()} {itemLabel} × {value}
          </span>
          <div className="text-right">
            <span className="text-foreground font-medium">
              = {totalItems.toLocaleString()} {itemLabel}
            </span>
            <span className="text-primary font-bold ml-2">
              ({currency}{totalPrice.toLocaleString()})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
